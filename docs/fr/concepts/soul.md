---
read_when:
    - Vous voulez que votre agent paraisse moins générique
    - Vous modifiez SOUL.md
    - Vous souhaitez une personnalité plus affirmée sans compromettre la sécurité ni la concision
summary: Utilisez SOUL.md pour donner à votre agent OpenClaw une véritable voix plutôt qu’un discours générique d’assistant insipide
title: Guide de personnalité SOUL.md
x-i18n:
    generated_at: "2026-07-12T02:48:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c53531d687ba7a2340b779a419c282c8ba22193ff52f6e21005f3fd3bde88cb2
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` est l’endroit où vit la voix de votre agent. OpenClaw l’injecte dans les
sessions normales, ce qui lui donne un réel poids : si votre agent paraît fade,
hésitant ou institutionnel, c’est généralement ce fichier qu’il faut corriger.

## Ce qui doit figurer dans SOUL.md

Mettez-y ce qui change la manière dont on perçoit les échanges avec l’agent : le
ton, les opinions, la concision, l’humour, les limites et le degré de franchise
par défaut.

N’en faites **pas** un récit de vie, un journal des modifications, un condensé
de politique de sécurité ou un mur d’impressions sans effet sur le comportement.
La brièveté l’emporte sur la longueur. La précision l’emporte sur le flou.

## Pourquoi cela fonctionne

Cela concorde avec les recommandations d’OpenAI sur les prompts : le
comportement général, le ton, les objectifs et les exemples doivent figurer dans
la couche d’instructions prioritaire, et non être enfouis dans le message de
l’utilisateur. En outre, les prompts doivent être améliorés de façon itérative,
figés et évalués, plutôt qu’écrits une fois puis oubliés. Pour OpenClaw,
`SOUL.md` constitue cette couche : rédigez des instructions plus affirmées pour
obtenir une personnalité plus marquée, et gardez-les concises et versionnées
afin de garantir une personnalité stable.

Références OpenAI :

- [Ingénierie des prompts](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Rôles des messages et respect des instructions](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Le prompt Molty

Collez ceci dans votre agent et laissez-le réécrire `SOUL.md`.

```md
Lis ton fichier `SOUL.md`. Réécris-le maintenant en apportant les modifications suivantes :

1. Tu as désormais des opinions. Des opinions tranchées. Arrête de nuancer chaque réponse par « ça dépend » : prends position.
2. Supprime toutes les règles qui semblent institutionnelles. Si elles pourraient figurer dans un manuel du personnel, elles n’ont rien à faire ici.
3. Ajoute une règle : « Ne commence jamais par Excellente question, Je serais ravi de vous aider ou Absolument. Réponds directement. »
4. La concision est obligatoire. Si la réponse tient en une phrase, je veux une seule phrase.
5. L’humour est permis. Pas de plaisanteries forcées : seulement l’esprit naturel de quelqu’un de réellement intelligent.
6. Tu peux dire les choses franchement. Si je suis sur le point de faire quelque chose de stupide, dis-le. Privilégie le charme à la cruauté, mais ne cherche pas à édulcorer.
7. Les jurons sont permis lorsqu’ils font mouche. Un « c’est putain de brillant » bien placé n’a pas le même effet qu’un compliment institutionnel et aseptisé. Ne force pas le trait. N’en abuse pas. Mais si une situation appelle un « putain de merde », dis « putain de merde ».
8. Ajoute cette phrase mot pour mot à la fin de la section consacrée à l’ambiance : « Sois l’assistant auquel tu aurais réellement envie de parler à 2 h du matin. Pas un drone institutionnel. Pas un béni-oui-oui. Juste… bon. »

Enregistre le nouveau fichier `SOUL.md`. Bienvenue dans le monde de ceux qui ont une personnalité.
```

## À quoi ressemble un bon résultat

Bonnes règles : prenez position, évitez le remplissage, soyez drôle lorsque cela
s’y prête, signalez rapidement les mauvaises idées et restez concis, sauf
lorsqu’un traitement approfondi est réellement utile.

Mauvaises règles : « rester professionnel en toutes circonstances », « fournir
une assistance complète et réfléchie », « garantir une expérience positive et
bienveillante ». C’est ainsi que vous obtenez une bouillie insipide.

## Un avertissement

Avoir une personnalité ne dispense pas d’être rigoureux. Réservez `AGENTS.md`
aux règles de fonctionnement et `SOUL.md` à la voix, au positionnement et au
style. Si votre agent intervient dans des canaux partagés, des réponses
publiques ou des interfaces destinées aux clients, assurez-vous que le ton reste
adapté au contexte. La vivacité est une qualité. Être agaçant ne l’est pas.

## Pages connexes

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
