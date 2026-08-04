# Créer un quiz — guide du fichier `.quiz.yml`

Ce guide décrit tout ce qu'on peut écrire dans un fichier `.quiz.yml` : la
structure générale, les réglages, et comment construire chaque question. Un
exemple complet est disponible dans `examples/gender-reveal.quiz.yml`.

Le fichier doit être déposé dans `packages/server/quizzes/` pour être
chargé par le serveur.

---

## Principe : média et réponse sont indépendants

Chaque question a deux notions séparées, qu'on combine librement :

- **`media`** (optionnel) : CE QUI EST MONTRÉ au joueur — une image, un
  extrait audio, ou une vidéo YouTube. N'importe quelle question peut en
  avoir un, ou aucun.
- **`answer`** : LE FORMAT DE RÉPONSE attendu — `boolean` (vrai/faux),
  `choice` (options à cocher), `text` (réponse libre), ou `number`
  (estimation chiffrée). Indépendant du média.

Concrètement, ça veut dire que "deviner qui est sur une photo" peut être une
réponse à choix (`media: image` + `answer.mode: choice`) OU en texte libre
(`media: image` + `answer.mode: text`) — à toi de choisir la combinaison qui
convient à ta question, il n'y a pas de "type" de question figé.

---

## Structure générale

```yaml
quiz:
  title: "Titre du quiz"          # obligatoire
  description: "Sous-titre"        # optionnel
  theme: pastel                     # optionnel, informatif seulement pour l'instant

  settings:
    max_players: 20                  # optionnel, défaut : 20
    mode: individual                  # individual | team — optionnel, défaut : individual
    show_answers: manual                # manual | automatic — optionnel, défaut : manual

teams:
  enabled: false                        # true pour activer le mode équipes

questions:
  - id: q1                                # optionnel — généré automatiquement (q1, q2...) si absent
    title: "L'énoncé de la question"        # obligatoire
    points: 1                                # optionnel, défaut : 1
    media: ...                                # optionnel — voir "Le média"
    answer: ...                                # obligatoire — voir "Le format de réponse"
```

Points à retenir :
- **`id`** : sert en interne à suivre les réponses. Autant le laisser de côté sauf si tu veux un identifiant stable et lisible.
- **`points`** : un entier positif. Pas de bonus de rapidité dans ce moteur — une bonne réponse rapporte toujours le même nombre de points, peu importe quand elle est donnée.
- **`show_answers`** : ce champ est actuellement lu mais sans effet différencié — dans les deux cas, c'est toujours l'animateur qui déclenche manuellement l'affichage de la correction depuis son écran (bouton "Voir la correction").
- **`teams.enabled`** : si `true`, l'animateur peut créer des équipes et y assigner les joueurs depuis son écran ; les scores se cumulent aussi au niveau de l'équipe.

---

## Le média (`media`, optionnel)

```yaml
media:
  type: image                     # image | audio | youtube
  source: "./images/bebe.jpg"      # requis pour type: image ou audio
  url: "https://youtube.com/xxx"    # requis pour type: youtube
  clip:                              # optionnel, informatif
    start: 35
    duration: 15
```

| `media.type` | Champ requis | Où mettre le fichier |
|---|---|---|
| `image` | `source` | `packages/server/quizzes/images/...` |
| `audio` | `source` | `packages/server/quizzes/audio/...` |
| `youtube` | `url` | (rien à héberger, juste le lien) |

**Chemins `source`** : toujours relatifs au dossier `packages/server/quizzes/`.
Écris `"./images/bebe.jpg"` et dépose le fichier dans
`packages/server/quizzes/images/bebe.jpg` — le serveur sert ce dossier
automatiquement sous `/quiz-media`.

**`clip.start` / `clip.duration`** (en secondes) : indicatifs, pour noter où
couper l'extrait. Pour une vidéo YouTube intégrée, `start` est utilisé pour
démarrer la lecture au bon endroit. Pour l'audio, ces champs restent pour
l'instant informatifs — l'extrait complet est lisible, à toi de le couper
en amont si besoin.

⚠️ **Limite actuelle** : l'aperçu du média côté écran animateur ne fonctionne
que pour les images. L'audio et le YouTube s'affichent et se jouent côté
joueur (téléphone), mais pas encore côté animateur.

---

## Le format de réponse (`answer`, obligatoire)

### `boolean` — Vrai / Faux

```yaml
answer:
  mode: boolean
  value: true
```

Deux boutons "Vrai" / "Faux", réponse envoyée directement au clic.

---

### `choice` — Choix parmi une liste

```yaml
answer:
  mode: choice
  multiple: true               # optionnel, défaut : false
  options:
    - text: "Emma"
      correct: true
    - text: "Louise"
      correct: true
    - text: "Alice"
      correct: false
```

- Au moins 2 options, au moins une `correct: true`.
- **`multiple: false`** (choix unique, défaut) : marque exactement **une seule** option `correct: true`. Le joueur clique une option et sa réponse part directement.
- **`multiple: true`** : le joueur coche autant d'options qu'il veut puis valide. Il doit cocher **exactement** l'ensemble des bonnes réponses (ni plus, ni moins) pour que ce soit compté correct — pas de points partiels.

---

### `text` — Réponse libre

Deux modes de correction.

**Correction automatique** — le moteur corrige seul :

```yaml
answer:
  mode: text
  correction: automatic
  accepted: ["Léa", "Lea"]
  fuzzy_matching: true          # optionnel, défaut : false
```

- `accepted` : liste des réponses acceptées (obligatoire en mode `automatic`).
- `fuzzy_matching: true` : tolère une petite faute de frappe (1 caractère d'erreur pour un mot court, 2 pour un mot de plus de 7 lettres).
- La comparaison ignore toujours la casse et les accents ("lea" = "Léa").

**Correction manuelle** — l'animateur juge chaque réponse à la main :

```yaml
answer:
  mode: text
  correction: manual
```

Aucun champ `accepted` nécessaire. Pendant la correction, l'écran animateur
liste chaque réponse reçue avec deux boutons **Correct / Incorrect**, à
cliquer un par un. Le score du joueur est ajusté en temps réel, y compris si
l'animateur change d'avis après coup.

---

### `number` — Estimation avec tolérance

```yaml
answer:
  mode: number
  range:
    min: 2000
    max: 5000
  value: 3500
  tolerance: 200
```

- `range.min` / `range.max` : bornes affichées au joueur (`min` doit être strictement inférieur à `max`).
- `value` : la bonne réponse — doit être comprise dans `range`.
- `tolerance` : marge d'erreur acceptée de part et d'autre de `value` (ici, 3400 ou 3600 seraient acceptés, pas 3800).

---

## Exemples combinés

**Photo à deviner, en choix multiple** (plutôt qu'en texte libre) :

```yaml
- title: "Qui est ce bébé ?"
  points: 2
  media:
    type: image
    source: "./images/bebe.jpg"
  answer:
    mode: choice
    options:
      - text: "Papa"
        correct: true
      - text: "Maman"
        correct: false
```

**Blindtest YouTube, réponse en options** :

```yaml
- title: "Quelle est cette chanson ?"
  points: 2
  media:
    type: youtube
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    clip:
      start: 35
      duration: 15
  answer:
    mode: choice
    options:
      - text: "Thriller"
        correct: true
      - text: "Billie Jean"
        correct: false
```

**Question sans média, simple estimation chiffrée** :

```yaml
- title: "Quel sera le poids du bébé (en grammes) ?"
  points: 3
  answer:
    mode: number
    range: { min: 2000, max: 5000 }
    value: 3500
    tolerance: 200
```

---

## Exemple minimal pour démarrer

```yaml
quiz:
  title: "Mon premier quiz"

questions:
  - title: "Le ciel est-il bleu ?"
    answer:
      mode: boolean
      value: true

  - title: "2 + 2 = ?"
    answer:
      mode: choice
      options:
        - text: "3"
        - text: "4"
          correct: true
        - text: "5"
```

Tous les champs optionnels ont des valeurs par défaut sensées (`points: 1`,
`max_players: 20`, mode individuel...), donc un quiz très court comme
celui-ci est un fichier `.quiz.yml` valide.

## Si le fichier a une erreur

Le serveur refuse de démarrer avec un `.quiz.yml` invalide et affiche des
messages lisibles pointant la question concernée, par exemple :

```
question 'q2' (réponse: choice) : au moins une option doit être marquée correct: true
question 'q5' (réponse: number) : range.min doit être strictement inférieur à range.max
```

Corrige le fichier et relance le serveur.
