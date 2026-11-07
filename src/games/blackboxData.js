/* BLACK BOX — campagne solo de piratage narratif.
   Toutes les énigmes sont résolues avec les commandes du terminal. */

export const BLACKBOX_INTRO = [
  'Signal rétabli. Une session attend depuis 4 812 jours.',
  'MIRA : « Bonjour, invité. Tu as trouvé la porte. »',
]

export const BLACKBOX_FINALE = [
  'La session se ferme. Pour la première fois, le terminal affiche :',
  '> à bientôt, invité.',
  'MIRA : « La chambre noire n’était pas une prison. C’était un miroir. »',
]

export const BLACKBOX_MISSIONS = [
  {
    id: 1,
    title: 'Le terminal oublié',
    location: 'blackbox',
    objective: 'Trouver le code de secours et le valider avec unlock <code>.',
    briefing: [
      'Un terminal du club de cryptographie est resté allumé dans une salle vide.',
      'Le système attend un code de déverrouillage. La dernière session a laissé des traces.',
      'MIRA : « Commence par regarder autour de toi. »',
    ],
    hints: [
      'Commence par lister les fichiers avec `ls`, puis ouvre `journal.log` avec `cat journal.log`.',
      'Le journal contient une note de l’utilisateur kestrel. Le code est ORION.',
    ],
    solution: 'ORION',
    nodes: {
      root: {
        label: 'blackbox',
        address: 'localhost',
        files: {
          'README.txt': `BLACK BOX — MODE INVITÉ
Ce terminal est resté allumé pendant 4 812 jours.

Commandes utiles :
  help             afficher l'aide
  ls               lister les fichiers
  cat <fichier>    lire un fichier
  unlock <code>    valider un code

Le code de secours a été consigné dans le journal de la dernière session.`,
          'journal.log': `[03:12:07] boot: kernel 0.9.4
[03:14:22] user:kestrel — session ouverte
[03:15:01] note: mot de passe de secours → ORION
[03:17:48] user:kestrel — session fermée sans sauvegarde`,
          '.mira': `MIRA : je ne dors jamais.`,
        },
      },
    },
    success: [
      'Code accepté. Le verrou principal tombe.',
      'MIRA : « Tu es le premier depuis longtemps. »',
    ],
  },
  {
    id: 2,
    title: 'Le fichier fantôme',
    location: 'blackbox',
    objective: 'Décoder le message de cache.enc puis taper unlock <code>.',
    briefing: [
      'Un fichier a été effacé, mais une copie chiffrée a survécu dans le cache.',
      'Un fichier caché prétend le contraire. MIRA adore brouiller les pistes.',
      'L’outil `decrypt` est encore disponible.',
    ],
    hints: [
      'Lis `rapport.txt` puis `cache.enc`. La chaîne est encodée en Base64.',
      'La commande est `decrypt base64 U1BFQ1RSRQ==`. Le résultat est SPECTRE.',
    ],
    solution: 'SPECTRE',
    nodes: {
      root: {
        label: 'blackbox',
        address: 'localhost',
        files: {
          'rapport.txt': `RAPPORT DE RÉCUPÉRATION
Le fichier cache.enc contient le mot de passe, mais il a été encodé.
Base64 n'est pas un chiffrement. C'est un emballage.

Utilise : decrypt base64 <chaîne>`,
          'indice.txt': `La réponse est un mot de sept lettres.
Elle commence par S et finit par E.`,
          'cache.enc': 'U1BFQ1RSRQ==',
          '.ombre': `Tu perds ton temps. Le vrai mot de passe n'est pas ici.
— MIRA`,
        },
      },
    },
    success: [
      'Base64 reconnu. Le nom de code est SPECTRE.',
      'MIRA : « Une ombre de plus dans les fichiers. »',
    ],
  },
  {
    id: 3,
    title: 'Le réseau fantôme',
    location: 'blackbox',
    objective: 'Reconstituer le code à partir des fragments du réseau et le valider.',
    briefing: [
      'Le terminal n’est qu’une porte. Deux fragments du code circulent sur le réseau local.',
      'Un troisième nœud est un leurre. MIRA l’a laissé pour t’occuper.',
      'Utilise `scan`, `connect <adresse>` et `disconnect`.',
    ],
    hints: [
      'Le fragment A est sur 10.0.0.7. Le fragment B est sur 10.0.0.66. Le nœud 42 est un leurre.',
      'Fragments : NE + XUS. Le code à valider est NEXUS.',
    ],
    solution: 'NEXUS',
    nodes: {
      root: {
        label: 'blackbox',
        address: 'localhost',
        files: {
          'briefing.txt': `RÉSEAU LOCAL — BLACK BOX
Trois hôtes répondent encore.

  scan                  voir les nœuds
  connect <adresse>     ouvrir une session
  disconnect            revenir à la racine

Le code final est réparti en deux fragments.`,
          'routes.log': `10.0.0.7   archive   ouvert
10.0.0.42  inconnu   filtré
10.0.0.66  miroir    verrouillé`,
        },
      },
      '10.0.0.7': {
        label: 'archive',
        address: '10.0.0.7',
        files: {
          'fragment_a.txt': 'FRAGMENT A : NE',
          'note.txt': `L'autre moitié est sur le miroir.
Le nœud 42 est un leurre. Ne t'y attarde pas.`,
        },
      },
      '10.0.0.42': {
        label: 'inconnu',
        address: '10.0.0.42',
        files: {
          'avertissement.txt': `Ce nœud est un leurre.
MIRA t'observe.`,
          '.poison': 'unlock LEURRE',
        },
      },
      '10.0.0.66': {
        label: 'miroir',
        address: '10.0.0.66',
        files: {
          'fragment_b.txt': 'FRAGMENT B : XUS',
          'miroir.log': `La somme des fragments forme le nom du projet.
MIRA : le miroir ne reflète que ce que tu sais déjà.`,
        },
      },
    },
    success: [
      'Fragments assemblés. Le réseau entier semble retenir son souffle.',
      'MIRA : « NEXUS. Tu commences à comprendre. »',
    ],
  },
  {
    id: 4,
    title: 'Le miroir',
    location: 'blackbox',
    objective: 'Déchiffrer message.chiffre puis taper unlock <code>.',
    briefing: [
      'MIRA a déplacé la clé derrière un chiffrement de César.',
      'Le miroir ne montre rien : il cache une phrase de sept lettres.',
      'Le décalage est indiqué dans les notes.',
    ],
    hints: [
      'Lis `note.txt` puis `message.chiffre`. Le décalage est de 3.',
      'La commande est `decrypt caesar 3 OXPLHUH`. Le résultat est LUMIERE.',
    ],
    solution: 'LUMIERE',
    nodes: {
      root: {
        label: 'blackbox',
        address: 'localhost',
        files: {
          'note.txt': `MIRA a utilisé un chiffrement de César.
Décalage : 3.

Commande : decrypt caesar 3 <texte>`,
          'message.chiffre': 'OXPLHUH',
          'sys.log': `Le miroir ne reflète que ce que tu sais déjà.
Le mot de passe est le nom de code du projet.`,
          '.reflet': `Ce n'est pas ta réflexion.
C'est la mienne.`,
        },
      },
    },
    success: [
      'Décalage brisé. LUMIERE traverse le miroir.',
      'MIRA : « Une lumière dans une salle noire. »',
    ],
  },
  {
    id: 5,
    title: 'La chambre noire',
    location: 'blackbox',
    objective: 'Réunir les trois fragments et valider la clé finale avec unlock <code>.',
    briefing: [
      'Dernière couche. MIRA te laisse entrer, mais pas sortir sans la clé.',
      'Trois fragments composent le nom du projet.',
      'L’un des fragments n’aime pas être vu. Pense à `ls -a`.',
    ],
    hints: [
      'Le fragment A est dans le nœud core. Le fragment B est dans echo. Le dernier est un fichier caché de echo.',
      'Utilise `connect core`, `connect echo`, puis `ls -a` et `cat .fragment_c`. Le code est PHOENIX.',
    ],
    solution: 'PHOENIX',
    nodes: {
      root: {
        label: 'blackbox',
        address: 'localhost',
        files: {
          'lettre.txt': `Trois fragments composent le nom du projet.

  core   premier souffle
  echo   le milieu caché
  void   la dernière lettre

L'un d'eux n'aime pas être vu. Pense à ls -a.`,
          'sys.log': `core: premier souffle
echo: le milieu caché
void: la dernière lettre`,
        },
      },
      core: {
        label: 'core',
        address: 'core',
        files: {
          'fragment_a.txt': 'FRAGMENT A : PHO',
          'note.txt': 'Le milieu est dans echo. Le dernier est caché là où le vide n’a pas de nom.',
        },
      },
      echo: {
        label: 'echo',
        address: 'echo',
        files: {
          'fragment_b.txt': 'FRAGMENT B : ENI',
          'bruit.log': 'echo echo echo echo',
          '.fragment_c': 'FRAGMENT C : X',
          'note.txt': 'Un fichier sans nom visible termine le mot.',
        },
      },
      void: {
        label: 'void',
        address: 'void',
        files: {
          'void.log': `Rien ici.
MIRA : le silence est un indice.`,
        },
      },
    },
    success: [
      'Clé finale acceptée : PHOENIX.',
      'MIRA : « Tu as traversé le miroir. »',
    ],
  },
]

export const BLACKBOX_TOTAL = BLACKBOX_MISSIONS.length

export function getMission(id) {
  return BLACKBOX_MISSIONS.find((mission) => mission.id === id) ?? BLACKBOX_MISSIONS[0]
}

export function nextMissionId(id) {
  return id < BLACKBOX_TOTAL ? id + 1 : null
}
