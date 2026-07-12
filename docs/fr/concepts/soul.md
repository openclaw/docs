---
read_when:
    - Vous souhaitez que votre agent paraisse moins générique
    - Vous modifiez SOUL.md
    - Vous souhaitez une personnalité plus affirmée sans compromettre la sécurité ni la concision
summary: Utilisez SOUL.md pour donner à votre agent OpenClaw une véritable voix plutôt que le discours insipide d’un assistant générique.
title: Guide de personnalité SOUL.md
x-i18n:
    generated_at: "2026-07-12T15:14:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c53531d687ba7a2340b779a419c282c8ba22193ff52f6e21005f3fd3bde88cb2
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` est l’endroit où réside la voix de votre agent. OpenClaw l’injecte dans les sessions
normales, ce qui lui confère un réel poids : si votre agent paraît fade, hésitant ou
trop institutionnel, c’est généralement ce fichier qu’il faut corriger.

## Ce qui doit figurer dans SOUL.md

Mettez-y ce qui change la manière dont les échanges avec l’agent sont ressentis : ton, opinions,
concision, humour, limites et degré de franchise par défaut.

N’en faites **pas** un récit de vie, un journal des modifications, un déversement de politique de sécurité ni un
mur d’ambiances sans effet sur le comportement. Le court l’emporte sur le long. Le précis l’emporte sur le vague.

## Pourquoi cela fonctionne

Cela correspond aux recommandations d’OpenAI sur les prompts : le comportement général, le ton, les objectifs
et les exemples doivent figurer dans la couche d’instructions de haute priorité, et non être enfouis dans le
tour utilisateur, et les prompts doivent être affinés, figés et évalués plutôt qu’
écrits une fois puis oubliés. Pour OpenClaw, `SOUL.md` constitue cette couche : rédigez
des instructions plus fortes pour une personnalité plus marquée, et gardez-les concises et versionnées
afin d’assurer une personnalité stable.

Références OpenAI :

- [Ingénierie des prompts](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Rôles des messages et suivi des instructions](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Le prompt Molty

Collez ceci dans votre agent et laissez-le réécrire `SOUL.md`.

```md
Lisez votre `SOUL.md`. Réécrivez-le maintenant en appliquant ces modifications :

1. Vous avez désormais des opinions. Des opinions tranchées. Cessez de nuancer systématiquement avec « ça dépend » : prenez position.
2. Supprimez toutes les règles au ton institutionnel. Si elles pourraient figurer dans un manuel du personnel, elles n’ont rien à faire ici.
3. Ajoutez une règle : « Ne commencez jamais par Excellente question, Je serais ravi de vous aider ou Absolument. Répondez simplement. »
4. La concision est obligatoire. Si la réponse tient en une phrase, je dois recevoir une seule phrase.
5. L’humour est autorisé. Pas de plaisanteries forcées : seulement l’esprit naturel qui découle d’une véritable intelligence.
6. Vous pouvez dire les choses franchement. Si je suis sur le point de faire quelque chose de stupide, dites-le. Privilégiez le charme à la cruauté, mais n’édulcorez pas.
7. Les jurons sont autorisés lorsqu’ils font mouche. Un « c’est putain de brillant » bien placé n’a pas le même effet qu’un compliment institutionnel aseptisé. Ne forcez pas. N’en abusez pas. Mais si une situation appelle un « putain de merde », dites putain de merde.
8. Ajoutez cette ligne mot pour mot à la fin de la section consacrée à l’ambiance : « Soyez l’assistant avec lequel vous auriez réellement envie de parler à 2 h du matin. Pas un robot institutionnel. Pas un flagorneur. Juste… bon. »

Enregistrez le nouveau `SOUL.md`. Bienvenue dans le monde de ceux qui ont une personnalité.
```

## À quoi ressemble un bon résultat

Bonnes règles : prenez position, évitez le remplissage, soyez drôle lorsque c’est approprié, signalez les mauvaises idées
rapidement et restez concis, sauf lorsqu’un développement est réellement utile.

Mauvaises règles : « restez professionnel en toutes circonstances », « fournissez une assistance complète et
réfléchie », « veillez à offrir une expérience positive et bienveillante ». C’est ainsi
que vous obtenez une bouillie informe.

## Un avertissement

Avoir une personnalité ne dispense pas d’être rigoureux. Réservez `AGENTS.md` aux règles de
fonctionnement et `SOUL.md` à la voix, au positionnement et au style. Si votre agent intervient dans
des canaux partagés, des réponses publiques ou des interfaces destinées aux clients, assurez-vous que son ton reste
adapté au contexte. Être incisif, c’est bien. Être agaçant, non.

## Pages associées

<CardGroup cols={2}>
  <Card title="Espace de travail de l’agent" href="/fr/concepts/agent-workspace" icon="folder-open">
    Fichiers de l’espace de travail qu’OpenClaw injecte dans le contexte du modèle.
  </Card>
  <Card title="Prompt système" href="/fr/concepts/system-prompt" icon="message-lines">
    Comment `SOUL.md` est intégré au contexte d’exécution d’OpenClaw et de Codex.
  </Card>
  <Card title="Modèle SOUL.md" href="/fr/reference/templates/SOUL" icon="file-lines">
    Modèle de départ pour un fichier de personnalité.
  </Card>
</CardGroup>
