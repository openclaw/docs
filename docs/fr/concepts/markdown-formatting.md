---
read_when:
    - Vous modifiez la mise en forme Markdown ou le découpage des messages pour les canaux sortants
    - Vous ajoutez un nouveau formateur de canal ou un nouveau mappage de style
    - Vous déboguez des régressions de mise en forme sur plusieurs canaux
summary: Pipeline de mise en forme Markdown pour les canaux sortants
title: Mise en forme Markdown
x-i18n:
    generated_at: "2026-07-12T02:34:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9a35fd9a6386068e1e3bec73ec6e692f49239b468f42dd737f919b1c6a88e41
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw convertit le Markdown sortant en une représentation intermédiaire
(IR) partagée avant de générer une sortie propre à chaque canal. L’IR conserve le texte brut ainsi que
les plages de style et de liens, de sorte qu’une seule étape d’analyse alimente chaque canal et que le découpage
ne scinde jamais la mise en forme au milieu d’une plage.

## Pipeline

1. **Analyser le Markdown en IR** (`markdownToIR`) - texte brut avec plages de style
   (gras, italique, barré, code, bloc de code, divulgâcheur, citation,
   titres de niveau 1 à 6) et plages de liens. Les décalages sont exprimés en unités de code UTF-16 afin que les plages de style
   de Signal correspondent directement à son API. Les tableaux ne sont analysés que lorsque le canal
   active un mode de tableau.
2. **Découper l’IR** (`chunkMarkdownIR` / `renderMarkdownIRChunksWithinLimit`)
   - le découpage s’effectue sur le texte de l’IR avant le rendu, de sorte que les styles intégrés et
     les liens sont répartis par fragment au lieu d’être rompus à une limite.
3. **Effectuer le rendu par canal** (`renderMarkdownWithMarkers`) - une table de correspondance des marqueurs de style
   transforme les plages en balisage natif du canal.

| Canal                                                            | Moteur de rendu                                                                       | Remarques                                                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Slack                                                            | jetons mrkdwn (`*bold*`, `_italic_`, `` `code` ``, blocs de code délimités)           | Les liens deviennent `<url\|label>` ; les liens automatiques sont désactivés pendant l’analyse pour éviter les doublons |
| Telegram                                                         | balises HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`, `<tg-spoiler>`) | Prend également en charge les tableaux et les titres des messages enrichis (`<h1>`-`<h6>`) lorsque `richMessages` est activé |
| Signal                                                           | texte brut + plages `text-style`                                                      | Les liens sont rendus sous la forme `label (url)` lorsque le libellé diffère de l’URL                         |
| Discord, WhatsApp, iMessage, Microsoft Teams et autres canaux    | texte brut                                                                           | Aucun style basé sur l’IR ; la conversion des tableaux Markdown s’effectue toujours via `convertMarkdownTables` |

## Exemple d’IR

Markdown d’entrée :
__OC_I18N_900000__
IR (schématique) :
__OC_I18N_900001__
## Gestion des tableaux

`markdown.tables` détermine la manière dont un canal convertit les tableaux Markdown, pour chaque
canal et, facultativement, pour chaque compte :

| Mode      | Comportement                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------ |
| `code`    | Effectuer le rendu sous forme de tableau ASCII aligné dans un bloc de code (valeur de repli par défaut) |
| `bullets` | Convertir chaque ligne en éléments de liste `label: value`                                       |
| `block`   | Conserver les tableaux natifs lorsque le transport les prend en charge ; sinon, revenir à `code` |
| `off`     | Désactiver l’analyse des tableaux ; le texte brut du tableau est transmis sans modification      |

Valeurs par défaut des Plugins par canal : Signal, WhatsApp et Matrix utilisent
`bullets` par défaut ; Mattermost utilise `off` par défaut ; Telegram utilise `block` par défaut (qui
se résout en `code`, sauf si `richMessages` est activé pour le compte). Tout
canal sans valeur par défaut explicite définie par un Plugin revient à `code`.
__OC_I18N_900002__
## Règles de découpage

- Les limites de fragment proviennent des adaptateurs ou de la configuration du canal et s’appliquent au texte de l’IR, et non
  à la sortie générée.
- Les blocs de code délimités sont conservés en un seul bloc avec un saut de ligne final afin que
  les canaux génèrent correctement le délimiteur de fermeture.
- Les préfixes de liste et de citation font partie du texte de l’IR, de sorte que le découpage ne
  scinde jamais un préfixe.
- Les styles intégrés ne sont jamais scindés entre plusieurs fragments ; le moteur de rendu rouvre un
  style actif au début du fragment suivant.

Consultez [Diffusion en continu et découpage](/concepts/streaming) pour en savoir plus sur les limites de fragment et
le comportement de distribution entre les canaux.

## Politique relative aux liens

- **Slack :** `[label](url)` -> `<url|label>` ; les URL brutes restent telles quelles.
- **Telegram :** `[label](url)` -> `<a href="url">label</a>` (mode d’analyse HTML).
- **Signal :** `[label](url)` -> `label (url)`, sauf si le libellé correspond déjà
  à l’URL.

## Divulgâcheurs

Les marqueurs de divulgâcheur (`||spoiler||`) sont analysés pour Signal (associés à des plages de style
`SPOILER`) et Telegram (associés à `<tg-spoiler>`). Les autres canaux traitent
`||...||` comme du texte brut.

## Ajouter ou mettre à jour le formateur d’un canal

1. **Analyser une seule fois** avec `markdownToIR(...)`, en transmettant les options adaptées au canal
   (`autolink`, `headingStyle`, `blockquotePrefix`, `tableMode`).
2. **Effectuer le rendu** avec `renderMarkdownWithMarkers(...)` et une table de correspondance des marqueurs de style (ou
   une logique personnalisée de plages de style pour les transports comme Signal).
3. **Découper** avec `chunkMarkdownIR(...)` ou
   `renderMarkdownIRChunksWithinLimit(...)` avant d’effectuer le rendu de chaque fragment.
4. **Connecter l’adaptateur** afin d’appeler le nouveau découpeur et le nouveau moteur de rendu depuis le
   chemin d’envoi sortant.
5. **Tester** avec des tests de format ainsi qu’un test de distribution sortante si le canal
   effectue un découpage.

## Pièges courants

- Les jetons Slack entre chevrons (`<@U123>`, `<#C123>`, `<https://...>`) doivent
  survivre à l’échappement ; le HTML brut doit toujours être échappé de manière sûre.
- Le HTML Telegram exige l’échappement du texte situé hors des balises afin d’éviter un balisage incorrect.
- Les plages de style Signal utilisent des décalages UTF-16, et non des décalages en points de code.
- Conservez les sauts de ligne finaux des blocs de code délimités afin que le marqueur de fermeture
  se trouve sur sa propre ligne.

## Contenu associé

<CardGroup cols={2}>
  <Card title="Diffusion en continu et découpage" href="/fr/concepts/streaming" icon="bars-staggered">
    Comportement de diffusion en continu sortante, limites des fragments et distribution propre à chaque canal.
  </Card>
  <Card title="Invite système" href="/fr/concepts/system-prompt" icon="message-lines">
    Ce que le modèle voit avant la conversation, y compris les fichiers injectés de l’espace de travail.
  </Card>
</CardGroup>
