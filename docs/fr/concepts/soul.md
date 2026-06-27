---
read_when:
    - Vous voulez que votre agent paraisse moins générique
    - Vous modifiez SOUL.md
    - Vous voulez une personnalité plus affirmée sans compromettre la sécurité ni la concision.
summary: Utilisez SOUL.md pour donner à votre agent OpenClaw une véritable voix plutôt qu’un contenu générique d’assistant
title: Guide de personnalité SOUL.md
x-i18n:
    generated_at: "2026-06-27T17:27:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d916e5c9a97f25b53c93da7969583a535b48ad49e02c30bbbbf2dbe0da0f589a
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` est l’endroit où vit la voix de votre agent.

OpenClaw l’injecte dans les sessions normales, il a donc un vrai poids. Si votre agent
semble fade, hésitant ou étrangement institutionnel, c’est généralement le fichier à corriger.

## Ce qui appartient à SOUL.md

Mettez-y ce qui change la sensation de parler à l’agent :

- le ton
- les opinions
- la concision
- l’humour
- les limites
- le niveau de franchise par défaut

Ne le transformez **pas** en :

- récit de vie
- changelog
- déversement de politique de sécurité
- immense mur d’ambiance sans effet comportemental

Court vaut mieux que long. Précis vaut mieux que vague.

## Pourquoi cela fonctionne

Cela s’aligne sur les recommandations de prompt d’OpenAI :

- Le guide d’ingénierie de prompt indique que le comportement de haut niveau, le ton, les objectifs et
  les exemples appartiennent à la couche d’instructions prioritaire, et non enfouis dans le
  tour utilisateur.
- Le même guide recommande de traiter les prompts comme quelque chose que vous itérez,
  épinglez et évaluez, pas comme une prose magique que vous écrivez une fois puis oubliez.

Pour OpenClaw, `SOUL.md` est cette couche.

Si vous voulez une meilleure personnalité, écrivez des instructions plus fortes. Si vous voulez une personnalité stable,
gardez-les concises et versionnées.

Références OpenAI :

- [Ingénierie de prompt](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Rôles de message et suivi des instructions](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Le prompt Molty

Collez ceci dans votre agent et laissez-le réécrire `SOUL.md`.

Chemin fixé pour les espaces de travail OpenClaw : utilisez `SOUL.md`, pas `http://SOUL.md`.

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## À quoi ressemble une bonne version

De bonnes règles `SOUL.md` ressemblent à ceci :

- avoir un point de vue
- éviter le remplissage
- être drôle quand cela s’y prête
- signaler tôt les mauvaises idées
- rester concis sauf quand la profondeur est vraiment utile

De mauvaises règles `SOUL.md` ressemblent à ceci :

- maintenir le professionnalisme en toutes circonstances
- fournir une assistance complète et réfléchie
- garantir une expérience positive et encourageante

Cette deuxième liste, c’est comme ça qu’on obtient de la bouillie.

## Un avertissement

La personnalité n’est pas une permission d’être négligent.

Gardez `AGENTS.md` pour les règles opérationnelles. Gardez `SOUL.md` pour la voix, la posture et le
style. Si votre agent travaille dans des canaux partagés, des réponses publiques ou des surfaces
client, assurez-vous que le ton reste adapté au contexte.

La précision est une bonne chose. Être agaçant ne l’est pas.

## Associé

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/fr/concepts/agent-workspace" icon="folder-open">
    Fichiers d’espace de travail qu’OpenClaw injecte dans le contexte du modèle.
  </Card>
  <Card title="System prompt" href="/fr/concepts/system-prompt" icon="message-lines">
    Comment `SOUL.md` est composé dans le contexte d’exécution d’OpenClaw et de Codex.
  </Card>
  <Card title="SOUL.md template" href="/fr/reference/templates/SOUL" icon="file-lines">
    Modèle de départ pour un fichier de personnalité.
  </Card>
</CardGroup>
