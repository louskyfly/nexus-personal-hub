import { ArrowRight, Check, ShieldCheck, Sparkles, Wrench } from 'lucide-react'
import { TOOLS } from '../lib/catalog'
import { usePrefs } from '../state/PrefsContext'
import { useNavigation } from '../state/NavigationContext'
import { PageHeader } from '../components/ui'
import { playSound } from '../lib/sound'

export default function ToolsPage() {
  const { prefs } = usePrefs()
  const { openTool } = useNavigation()

  return (
    <div className="page tools-page">
      <PageHeader
        eyebrow="Nexus Tools"
        title="La boîte à outils du quotidien."
        description="Huit outils autonomes, exécutés entièrement dans votre navigateur. Aucun fichier ni texte n’est envoyé sur un serveur."
        actions={
          <div className="tools-trust glass">
            <ShieldCheck size={18} />
            <div>
              <strong>Traitement local</strong>
              <span>{prefs.toolsUsed.length} / {TOOLS.length} outils découverts</span>
            </div>
          </div>
        }
      />

      <div className="tool-grid">
        {TOOLS.map((tool) => {
          const Icon = tool.icon
          const used = prefs.toolsUsed.includes(tool.id)
          return (
            <article className="tool-card glass" key={tool.id}>
              <button
                type="button"
                className="tool-art"
                style={{ '--hue': tool.hue }}
                onClick={() => {
                  playSound('open')
                  openTool(tool.id)
                }}
                aria-label={`Ouvrir ${tool.title}`}
              >
                <span className="tool-art-halo" aria-hidden="true" />
                <Icon size={38} strokeWidth={1.4} />
                {used ? <span className="tool-used"><Check size={11} /> Utilisé</span> : null}
              </button>
              <div className="tool-card-body">
                <div>
                  <span className="eyebrow">{tool.tagline}</span>
                  <h3>{tool.title}</h3>
                </div>
                <p>{tool.description}</p>
                <button
                  type="button"
                  className="tool-open"
                  onClick={() => {
                    playSound('open')
                    openTool(tool.id)
                  }}
                >
                  Ouvrir l’outil <ArrowRight size={14} />
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <div className="tools-footer glass">
        <span className="tools-footer-icon"><Wrench size={18} /></span>
        <div>
          <strong>Conçu pour être rapide</strong>
          <p>
            Les conversions, générations et prélèvements de couleur fonctionnent sans connexion. La roue conserve ses options,
            et vos données passent par l’export global des paramètres.
          </p>
        </div>
        <Sparkles size={18} className="tools-footer-spark" />
      </div>
    </div>
  )
}
