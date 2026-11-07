import { useRef, useState } from 'react'
import {
  Check,
  Database,
  Download,
  HardDrive,
  Keyboard,
  MonitorSmartphone,
  Palette,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useData } from '../state/DataContext'
import { usePrefs } from '../state/PrefsContext'
import { useNavigation } from '../state/NavigationContext'
import { useToast } from '../components/Toast'
import { useOnline } from '../lib/hooks'
import { ConfirmDialog, PageHeader, Switch } from '../components/ui'
import { ACCENTS, THEMES } from '../lib/themes'
import { downloadText, humanBytes, storageBytes } from '../lib/utils'
import { playSound } from '../lib/sound'

const APP_VERSION = '1.1.0'

const SHORTCUTS = [
  ['⌘ / Ctrl + K', 'Ouvrir la recherche globale'],
  ['⌘ / Ctrl + B', 'Replier ou déployer la barre latérale'],
  ['Alt + 1 … 6', 'Naviguer entre les sections'],
  ['Échap', 'Fermer la fenêtre ou le panneau actif'],
  ['Entrée', 'Valider la recherche ou un formulaire'],
]

export default function SettingsPage({ onCustomize, installPrompt, onInstall, standalone }) {
  const { data, saveState, backend, importContent, resetContent } = useData()
  const { prefs, setPref, resetPrefs } = usePrefs()
  const { navigate } = useNavigation()
  const { toast } = useToast()
  const online = useOnline()
  const [confirm, setConfirm] = useState(null)
  const [pendingImport, setPendingImport] = useState(null)
  const [importError, setImportError] = useState('')
  const fileRef = useRef(null)

  const dataBytes = storageBytes(data)
  const prefBytes = storageBytes(prefs)
  const totalBytes = dataBytes + prefBytes

  const exportData = () => {
    const payload = {
      app: 'NEXUS',
      format: 'nexus-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      content: data,
      prefs,
    }
    downloadText(JSON.stringify(payload, null, 2), `nexus-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`)
    toast({ title: 'Sauvegarde exportée', description: `${humanBytes(totalBytes)} de données`, tone: 'success' })
    playSound('success')
  }

  const readImport = async (file) => {
    if (!file) return
    setImportError('')
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const content = parsed?.content ?? (parsed?.notes || parsed?.tasks ? parsed : null)
      if (!content || typeof content !== 'object') {
        setImportError('Ce fichier ne contient pas de sauvegarde NEXUS reconnue.')
        return
      }
      setPendingImport({ payload: parsed, content, prefs: parsed?.prefs ?? null })
    } catch {
      setImportError('Fichier JSON invalide.')
    }
  }

  const applyImport = () => {
    if (!pendingImport) return
    importContent(pendingImport.content)
    if (pendingImport.prefs && typeof pendingImport.prefs === 'object') {
      setPref({ ...pendingImport.prefs })
    }
    toast({
      title: 'Données importées',
      description: 'Vos notes, tâches, réglages et statistiques ont été restaurés.',
      tone: 'success',
    })
    setPendingImport(null)
    playSound('success')
  }

  const storageOnline = saveState === 'saving' ? 'Enregistrement…' : saveState === 'error' ? 'Échec d’écriture' : 'À jour'

  return (
    <div className="page settings-page">
      <PageHeader
        eyebrow="Paramètres"
        title="Un espace qui vous ressemble."
        description="Apparence, animations, sons, raccourcis et données. Chaque réglage est appliqué immédiatement."
        actions={
          <div className="settings-status glass">
            {online ? <Wifi size={16} /> : <WifiOff size={16} />}
            <div>
              <strong>{online ? 'En ligne' : 'Hors connexion'}</strong>
              <span>{storageOnline}</span>
            </div>
          </div>
        }
      />

      <div className="settings-grid">
        <section className="settings-card glass">
          <div className="settings-head">
            <span className="settings-icon"><Palette size={18} /></span>
            <div>
              <h2>Apparence</h2>
              <p>Thème, accent et identité visuelle.</p>
            </div>
          </div>

          <label className="field">
            <span className="field-label">Votre prénom / nom affiché</span>
            <input
              type="text"
              value={prefs.name}
              onChange={(event) => setPref('name', event.target.value.slice(0, 40))}
              placeholder="Comment devons-nous vous appeler ?"
              maxLength={40}
            />
            <span className="field-hint">Utilisé uniquement dans le message de bienvenue.</span>
          </label>

          <div className="theme-options">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className={`theme-option ${prefs.theme === theme.id ? 'is-active' : ''}`}
                onClick={() => {
                  setPref('theme', theme.id)
                  playSound('click')
                }}
                aria-pressed={prefs.theme === theme.id}
              >
                <span className="theme-preview" style={{ '--one': theme.swatch[0], '--two': theme.swatch[1], '--three': theme.swatch[2] }}>
                  <span className="theme-preview-glass" />
                </span>
                <span className="theme-copy">
                  <strong>{theme.name}</strong>
                  <small>{theme.description}</small>
                </span>
                {prefs.theme === theme.id ? <Check size={15} className="theme-check" /> : null}
              </button>
            ))}
          </div>

          <div className="accent-picker">
            <span className="field-label">Couleur d’accentuation</span>
            <div className="accent-swatches">
              {ACCENTS.map((accent) => (
                <button
                  key={accent.id}
                  type="button"
                  className={`accent-dot ${prefs.accent === accent.id ? 'is-active' : ''}`}
                  style={{ '--dot': accent.color }}
                  onClick={() => {
                    setPref('accent', accent.id)
                    playSound('click')
                  }}
                  aria-label={`Accent ${accent.name}`}
                  aria-pressed={prefs.accent === accent.id}
                  title={accent.name}
                />
              ))}
            </div>
          </div>

          <div className="settings-switch-list">
            <Switch
              checked={prefs.animations}
              onChange={(value) => setPref('animations', value)}
              label="Animations d’interface"
              description="Ouvertures, transitions et micro-interactions."
            />
            <Switch
              checked={prefs.discreteMode}
              onChange={(value) => setPref('discreteMode', value)}
              label="Mode discret"
              description="Réduit les flous, les lueurs et l’intensité visuelle."
            />
            <Switch
              checked={prefs.weekStart === 1}
              onChange={(value) => setPref('weekStart', value ? 1 : 0)}
              label="Semaine commençant le lundi"
              description="Le calendrier s’aligne sur votre semaine."
            />
          </div>
        </section>

        <section className="settings-card glass">
          <div className="settings-head">
            <span className="settings-icon"><Volume2 size={18} /></span>
            <div>
              <h2>Sons & retours</h2>
              <p>Effets sonores synthétisés, sans fichier externe.</p>
            </div>
          </div>
          <div className="settings-switch-list">
            <Switch
              checked={prefs.sound}
              onChange={(value) => {
                setPref('sound', value)
                if (value) playSound('success')
              }}
              label="Sons de l’interface et de l’arcade"
              description="Clics, succès, fins de partie et minuteur."
            />
          </div>
          <label className={`slider-field ${!prefs.sound ? 'is-disabled' : ''}`}>
            <span>Volume <strong>{Math.round(prefs.soundVolume * 100)} %</strong></span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={prefs.soundVolume}
              disabled={!prefs.sound}
              onChange={(event) => setPref('soundVolume', Number(event.target.value))}
            />
          </label>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              playSound('success')
              toast({ title: 'Son de test', description: 'Le volume actuel est appliqué.', duration: 1800 })
            }}
            disabled={!prefs.sound}
          >
            <Volume2 size={14} /> Tester le son
          </button>

          <div className="settings-divider" />

          <div className="settings-head compact">
            <span className="settings-icon"><Keyboard size={18} /></span>
            <div>
              <h2>Raccourcis</h2>
              <p>Actions rapides au clavier.</p>
            </div>
          </div>
          <Switch
            checked={prefs.shortcuts}
            onChange={(value) => setPref('shortcuts', value)}
            label="Activer les raccourcis globaux"
            description="Désactivés, ils restent listés ci-dessous."
          />
          <ul className={`shortcut-list ${!prefs.shortcuts ? 'is-muted' : ''}`}>
            {SHORTCUTS.map(([keys, label]) => (
              <li key={keys}>
                <kbd>{keys}</kbd>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="settings-card glass">
          <div className="settings-head">
            <span className="settings-icon"><Settings2 size={18} /></span>
            <div>
              <h2>Tableau de bord</h2>
              <p>Widgets, tailles et disposition.</p>
            </div>
          </div>
          <div className="settings-metrics">
            <div>
              <strong>{prefs.layoutHome.length}</strong>
              <span>widgets sur l’accueil</span>
            </div>
            <div>
              <strong>{prefs.layoutDash.length}</strong>
              <span>widgets sur le dashboard</span>
            </div>
          </div>
          <p className="hint">
            Utilisez le bouton Personnaliser de la barre supérieure pour afficher, masquer, déplacer et redimensionner
            chaque module. La disposition est sauvegardée automatiquement.
          </p>
          <button type="button" className="btn btn-secondary full" onClick={() => onCustomize('dashboard')}>
            <Sparkles size={15} /> Personnaliser la disposition
          </button>
          <div className="settings-divider" />
          <Switch
            checked={prefs.sidebarCollapsed}
            onChange={(value) => setPref('sidebarCollapsed', value)}
            label="Barre latérale repliée"
            description="Conservez plus d’espace pour vos modules."
          />
        </section>

        <section className="settings-card glass">
          <div className="settings-head">
            <span className="settings-icon"><Database size={18} /></span>
            <div>
              <h2>Données & sauvegarde</h2>
              <p>Stockage local, export et import.</p>
            </div>
          </div>
          <div className="storage-row">
            <span className="storage-icon"><HardDrive size={18} /></span>
            <div>
              <strong>{humanBytes(totalBytes)}</strong>
              <span>estimés · stockage {backend === 'localstorage' ? 'localStorage (secours)' : 'IndexedDB'}</span>
            </div>
            <span className={`save-pill ${saveState}`}>{storageOnline}</span>
          </div>
          <div className="settings-button-row">
            <button type="button" className="btn btn-secondary" onClick={exportData}>
              <Download size={15} /> Exporter (JSON)
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
              <Upload size={15} /> Importer
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => {
                readImport(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </div>
          {importError ? <p className="inline-error">{importError}</p> : null}
          <p className="hint">
            L’export contient vos notes, tâches, favoris, préférences et statistiques d’arcade. Importez-le sur un autre
            navigateur pour tout retrouver.
          </p>
          <div className="danger-zone">
            <div>
              <strong>Réinitialiser NEXUS</strong>
              <span>Efface définitivement toutes les données locales.</span>
            </div>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirm({ type: 'reset' })}>
              <Trash2 size={14} /> Tout effacer
            </button>
          </div>
        </section>

        <section className="settings-card glass">
          <div className="settings-head">
            <span className="settings-icon"><MonitorSmartphone size={18} /></span>
            <div>
              <h2>Application</h2>
              <p>Installation, hors connexion et confidentialité.</p>
            </div>
          </div>
          <div className="pwa-row">
            <div>
              <strong>{standalone ? 'NEXUS est installée' : 'Installer NEXUS'}</strong>
              <span>
                {standalone
                  ? 'Ouverte en mode application autonome.'
                  : 'Ajoutez le hub à votre écran d’accueil pour un accès instantané hors ligne.'}
              </span>
            </div>
            {!standalone ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  if (installPrompt) await onInstall()
                  else {
                    toast({
                      title: 'Installation via le navigateur',
                      description: 'Menu du navigateur → « Installer l’application » ou « Ajouter à l’écran d’accueil ».',
                      duration: 7000,
                    })
                  }
                }}
              >
                Installer
              </button>
            ) : (
              <span className="installed-badge"><Check size={13} /> Installée</span>
            )}
          </div>
          <ul className="about-list">
            <li><Wifi size={14} /><span>Fonctionne hors ligne après le premier chargement. Seule la météo nécessite Internet.</span></li>
            <li><ShieldCheck size={14} /><span>Aucune donnée n’est envoyée à un serveur NEXUS. Tout reste sur cet appareil.</span></li>
            <li><Database size={14} /><span>Contenu structuré : IndexedDB · préférences : localStorage.</span></li>
          </ul>
          <div className="about-footer">
            <span>NEXUS — Personal Hub · version {APP_VERSION}</span>
            <span>{data.notes.length} note{data.notes.length === 1 ? '' : 's'} · {data.tasks.length} tâche{data.tasks.length === 1 ? '' : 's'} · {data.stats.gamesPlayed} partie{data.stats.gamesPlayed === 1 ? '' : 's'}</span>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirm?.type === 'reset'}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await resetContent()
          resetPrefs()
          toast({ title: 'NEXUS réinitialisé', description: 'Toutes les données locales ont été effacées.', tone: 'success' })
          navigate('home')
        }}
        title="Effacer toutes les données ?"
        description="Notes, tâches, favoris, réglages et statistiques seront définitivement supprimés de cet appareil. Cette action est irréversible."
        confirmLabel="Tout effacer"
      />

      <ConfirmDialog
        open={Boolean(pendingImport)}
        onClose={() => setPendingImport(null)}
        onConfirm={applyImport}
        title="Importer cette sauvegarde ?"
        description={
          pendingImport
            ? `Le fichier contient ${pendingImport.content.notes?.length ?? 0} note(s), ${pendingImport.content.tasks?.length ?? 0} tâche(s) et des statistiques d’arcade. Le contenu actuel sera remplacé.`
            : ''
        }
        confirmLabel="Remplacer mes données"
        tone="primary"
      />
    </div>
  )
}
