---
read_when:
    - Vous modifiez la mise en forme Markdown ou le découpage pour les canaux sortants
    - Vous ajoutez un nouveau formateur de canal ou un nouveau mappage de style
    - Vous déboguez des régressions de mise en forme sur plusieurs canaux
summary: Pipeline de mise en forme Markdown pour les canaux sortants
title: Mise en forme Markdown
x-i18n:
    generated_at: "2026-07-12T15:15:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f9a35fd9a6386068e1e3bec73ec6e692f49239b468f42dd737f919b1c6a88e41
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw convertit le Markdown sortant en une représentation intermédiaire
(IR) partagée avant de générer une sortie propre à chaque canal. L’IR conserve le texte brut ainsi que
les plages de style et de lien, afin qu’une seule étape d’analyse alimente chaque canal et que le découpage
ne scinde jamais la mise en forme au milieu d’une plage.

## Pipeline

1. **Analyser le Markdown en IR** (`markdownToIR`) - texte brut accompagné de plages de style
   (gras, italique, barré, code, bloc de code, texte masqué, citation,
   titre de niveau 1 à 6) et de plages de lien. Les décalages sont exprimés en unités de code UTF-16 afin que les plages
   de style Signal correspondent directement à son API. Les tableaux ne sont analysés que lorsque le canal
   active un mode de tableau.
2. **Découper l’IR** (`chunkMarkdownIR` / `renderMarkdownIRChunksWithinLimit`)
   - le découpage s’effectue sur le texte de l’IR avant le rendu, de sorte que les styles en ligne et
     les liens soient répartis par fragment au lieu d’être interrompus à une limite.
3. **Effectuer le rendu par canal** (`renderMarkdownWithMarkers`) - une table de correspondance des marqueurs de style
   transforme les plages en balisage natif du canal.

| Canal                                                             | Moteur de rendu                                                                       | Remarques                                                                                                  |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Slack                                                             | jetons mrkdwn (`*bold*`, `_italic_`, `` `code` ``, délimiteurs de blocs de code)       | Les liens deviennent `<url\|label>` ; la détection automatique des liens est désactivée pendant l’analyse pour éviter les liens en double |
| Telegram                                                          | balises HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`, `<tg-spoiler>`) | Prend également en charge les tableaux et titres des messages enrichis (`<h1>`-`<h6>`) lorsque `richMessages` est activé |
| Signal                                                            | texte brut + plages `text-style`                                                       | Les liens sont rendus sous la forme `label (url)` lorsque le libellé diffère de l’URL                      |
| Discord, WhatsApp, iMessage, Microsoft Teams et autres canaux     | texte brut                                                                            | Aucun style fondé sur l’IR ; la conversion des tableaux Markdown s’effectue toujours via `convertMarkdownTables` |

## Exemple d’IR

Markdown en entrée :
__OC_I18N_900000__
IR (schématique) :
__OC_I18N_900001__
## Gestion des tableaux

`markdown.tables` détermine la manière dont un canal convertit les tableaux Markdown, pour chaque
canal et, facultativement, pour chaque compte :

| Mode      | Comportement                                                                                  |
| --------- | --------------------------------------------------------------------------------------------- |
| `code`    | Effectue le rendu sous forme de tableau ASCII aligné dans un bloc de code (valeur de repli par défaut) |
| `bullets` | Convertit chaque ligne en puces `label: value`                                                 |
| `block`   | Conserve les tableaux natifs lorsque le transport les prend en charge ; revient sinon à `code` |
| `off`     | Désactive l’analyse des tableaux ; le texte brut du tableau est transmis sans modification     |

Valeurs par défaut des Plugins pour chaque canal : Signal, WhatsApp et Matrix utilisent
`bullets` par défaut ; Mattermost utilise `off` par défaut ; Telegram utilise `block` par défaut (qui
se résout en `code`, sauf si `richMessages` est activé pour le compte). Tout
canal sans valeur par défaut explicite du Plugin revient à `code`.
__OC_I18N_900002__
## Règles de découpage

- Les limites de fragments proviennent des adaptateurs ou de la configuration des canaux et s’appliquent au texte de l’IR, et non
  à la sortie rendue.
- Les blocs de code délimités sont conservés en un seul bloc avec un saut de ligne final afin que
  les canaux affichent correctement le délimiteur de fermeture.
- Les préfixes de liste et de citation font partie du texte de l’IR, de sorte que le découpage ne
  les scinde jamais en leur milieu.
- Les styles en ligne ne sont jamais scindés entre les fragments ; le moteur de rendu rouvre un
  style actif au début du fragment suivant.

Consultez [Diffusion et découpage](/concepts/streaming) pour en savoir plus sur les limites de fragments et
le comportement de distribution entre les canaux.

## Politique relative aux liens

- **Slack :** `[label](url)` -> `<url|label>` ; les URL nues restent nues.
- **Telegram :** `[label](url)` -> `<a href="url">label</a>` (mode d’analyse HTML).
- **Signal :** `[label](url)` -> `label (url)`, sauf si le libellé correspond déjà
  à l’URL.

## Textes masqués

Les marqueurs de texte masqué (`||spoiler||`) sont analysés pour Signal (associés à des plages de style `SPOILER`)
et Telegram (associés à `<tg-spoiler>`). Les autres canaux traitent
`||...||` comme du texte brut.

## Ajouter ou mettre à jour un formateur de canal

1. **Effectuez une seule analyse** avec `markdownToIR(...)`, en transmettant les options adaptées
   au canal (`autolink`, `headingStyle`, `blockquotePrefix`, `tableMode`).
2. **Effectuez le rendu** avec `renderMarkdownWithMarkers(...)` et une table de correspondance des marqueurs de style (ou
   une logique personnalisée de plages de style pour les transports comme Signal).
3. **Découpez** avec `chunkMarkdownIR(...)` ou
   `renderMarkdownIRChunksWithinLimit(...)` avant le rendu de chaque fragment.
4. **Connectez l’adaptateur** afin qu’il appelle le nouveau découpeur et le nouveau moteur de rendu depuis le
   chemin d’envoi sortant.
5. **Testez** avec des tests de format ainsi qu’un test de distribution sortante si le canal
   effectue un découpage.

## Pièges courants

- Les jetons Slack entre chevrons (`<@U123>`, `<#C123>`, `<https://...>`) doivent
  être préservés lors de l’échappement ; le HTML brut doit néanmoins être échappé de manière sûre.
- Le HTML Telegram exige d’échapper le texte situé hors des balises pour éviter un balisage incorrect.
- Les plages de style Signal utilisent des décalages UTF-16, et non des décalages en points de code.
- Préservez les sauts de ligne finaux des blocs de code délimités afin que le marqueur de fermeture
  se trouve sur sa propre ligne.

## Rubriques connexes

<CardGroup cols={2}>
  <Card title="Diffusion et découpage" href="/fr/concepts/streaming" icon="bars-staggered">
    Comportement de la diffusion sortante, limites des fragments et distribution propre à chaque canal.
  </Card>
  <Card title="Invite système" href="/fr/concepts/system-prompt" icon="message-lines">
    Ce que le modèle voit avant la conversation, y compris les fichiers injectés de l’espace de travail.
  </Card>
</CardGroup>
