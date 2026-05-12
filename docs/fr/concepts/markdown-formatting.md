---
read_when:
    - Vous modifiez la mise en forme Markdown ou le découpage en fragments pour les canaux sortants
    - Vous ajoutez un nouveau formateur de canal ou mappage de style
    - Vous déboguez des régressions de mise en forme sur plusieurs canaux
summary: Pipeline de mise en forme Markdown pour les canaux sortants
title: Mise en forme Markdown
x-i18n:
    generated_at: "2026-05-12T12:50:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92aaf1063ebcbd8630dfcb8ca0a4e9eeb1c64f5b8868bf11c836777180515
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw met en forme le Markdown sortant en le convertissant en une représentation
intermédiaire (IR) partagée avant de générer une sortie propre à chaque canal. L’IR conserve le
texte source intact tout en portant les plages de style et de liens afin que le découpage et le rendu
restent cohérents entre les canaux.

## Objectifs

- **Cohérence :** une seule étape d’analyse, plusieurs moteurs de rendu.
- **Découpage sûr :** scinder le texte avant le rendu afin que la mise en forme en ligne ne se
  rompe jamais entre les blocs.
- **Adaptation au canal :** convertir la même IR en mrkdwn Slack, HTML Telegram et plages de
  style Signal sans réanalyser le Markdown.

## Pipeline

1. **Analyser le Markdown -> IR**
   - L’IR est du texte brut accompagné de plages de style (gras/italique/barré/code/spoiler) et de plages de liens.
   - Les décalages utilisent des unités de code UTF-16 afin que les plages de style Signal s’alignent avec son API.
   - Les tableaux ne sont analysés que lorsqu’un canal active la conversion des tableaux.
2. **Découper l’IR (format d’abord)**
   - Le découpage s’effectue sur le texte de l’IR avant le rendu.
   - La mise en forme en ligne n’est pas scindée entre les blocs ; les plages sont découpées par bloc.
3. **Rendre par canal**
   - **Slack :** jetons mrkdwn (gras/italique/barré/code), liens sous forme `<url|label>`.
   - **Telegram :** balises HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal :** texte brut + plages `text-style` ; les liens deviennent `label (url)` lorsque le libellé diffère.

## Exemple d’IR

Markdown d’entrée :

```markdown
Hello **world** - see [docs](https://docs.openclaw.ai).
```

IR (schématique) :

```json
{
  "text": "Hello world - see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Où elle est utilisée

- Les adaptateurs sortants Slack, Telegram et Signal effectuent le rendu depuis l’IR.
- Les autres canaux (WhatsApp, iMessage, Microsoft Teams, Discord) utilisent encore du texte brut ou
  leurs propres règles de mise en forme, avec la conversion des tableaux Markdown appliquée avant
  le découpage lorsqu’elle est activée.

## Gestion des tableaux

Les tableaux Markdown ne sont pas pris en charge de manière cohérente par tous les clients de chat. Utilisez
`markdown.tables` pour contrôler la conversion par canal (et par compte).

- `code` : rend les tableaux sous forme de blocs de code (valeur par défaut pour la plupart des canaux).
- `bullets` : convertit chaque ligne en puces (valeur par défaut pour Matrix, Signal et WhatsApp).
- `off` : désactive l’analyse et la conversion des tableaux ; le texte brut du tableau est transmis tel quel.

Clés de configuration :

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## Règles de découpage

- Les limites de découpage proviennent des adaptateurs/configurations de canal et sont appliquées au texte de l’IR.
- Les blocs de code clôturés sont conservés comme un bloc unique avec un saut de ligne final afin que les canaux
  les affichent correctement.
- Les préfixes de liste et les préfixes de citation font partie du texte de l’IR, donc le découpage
  ne scinde pas un préfixe en son milieu.
- Les styles en ligne (gras/italique/barré/code-en-ligne/spoiler) ne sont jamais scindés entre
  les blocs ; le moteur de rendu rouvre les styles dans chaque bloc.

Si vous avez besoin de plus de détails sur le comportement du découpage entre les canaux, consultez
[Streaming + découpage](/fr/concepts/streaming).

## Politique de liens

- **Slack :** `[label](url)` -> `<url|label>` ; les URL nues restent nues. L’autolien
  est désactivé pendant l’analyse pour éviter les doubles liens.
- **Telegram :** `[label](url)` -> `<a href="url">label</a>` (mode d’analyse HTML).
- **Signal :** `[label](url)` -> `label (url)` sauf si le libellé correspond à l’URL.

## Spoilers

Les marqueurs de spoiler (`||spoiler||`) ne sont analysés que pour Signal, où ils correspondent à
des plages de style SPOILER. Les autres canaux les traitent comme du texte brut.

## Comment ajouter ou mettre à jour un formateur de canal

1. **Analyser une seule fois :** utilisez l’assistant partagé `markdownToIR(...)` avec les options appropriées au canal
   (autolien, style de titre, préfixe de citation).
2. **Rendre :** implémentez un moteur de rendu avec `renderMarkdownWithMarkers(...)` et une
   carte de marqueurs de style (ou des plages de style Signal).
3. **Découper :** appelez `chunkMarkdownIR(...)` avant le rendu ; rendez chaque bloc.
4. **Brancher l’adaptateur :** mettez à jour l’adaptateur sortant du canal pour utiliser le nouveau découpeur
   et le nouveau moteur de rendu.
5. **Tester :** ajoutez ou mettez à jour les tests de format et un test de livraison sortante si le
   canal utilise le découpage.

## Pièges courants

- Les jetons Slack entre chevrons (`<@U123>`, `<#C123>`, `<https://...>`) doivent être
  préservés ; échappez le HTML brut de manière sûre.
- Le HTML Telegram exige d’échapper le texte hors balises pour éviter un balisage cassé.
- Les plages de style Signal dépendent des décalages UTF-16 ; n’utilisez pas de décalages en points de code.
- Préservez les sauts de ligne finaux des blocs de code clôturés afin que les marqueurs de fermeture arrivent sur
  leur propre ligne.

## Liés

<CardGroup cols={2}>
  <Card title="Streaming et découpage" href="/fr/concepts/streaming" icon="bars-staggered">
    Comportement du streaming sortant, limites des blocs et livraison propre à chaque canal.
  </Card>
  <Card title="Invite système" href="/fr/concepts/system-prompt" icon="message-lines">
    Ce que le modèle voit avant la conversation, y compris les fichiers d’espace de travail injectés.
  </Card>
</CardGroup>
