---
read_when:
    - Vous souhaitez qu’un agent affiche un résultat interactif dans le chat web
    - Vous avez besoin du contrat d’entrée, de sécurité ou de conservation de show_widget
sidebarTitle: Show widget
summary: Afficher des widgets SVG ou HTML autonomes directement dans le chat web
title: Afficher le widget
x-i18n:
    generated_at: "2026-07-12T03:25:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2de3760ec3aba9e6551eb31129c32f74fc69a8a158f9d6bde5a823136e5eae87
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget` affiche en ligne un fragment SVG ou HTML autonome dans la transcription de la conversation de l’interface de contrôle. Le Plugin Canvas intégré possède l’outil et héberge chaque résultat sous la forme d’un document Canvas de même origine.

L’outil est disponible uniquement lorsque le client Gateway d’origine déclare la capacité `inline-widgets`. L’interface de contrôle déclare automatiquement cette capacité. Les exécutions sur des canaux tels que Telegram et WhatsApp ne reçoivent pas `show_widget`.

Le transport des capacités couvre les moteurs de modèles intégrés, ceux reposant sur le serveur d’application Codex et ceux reposant sur la CLI. Les appelants MCP authentifiés par autorisation et les appelants directs de l’outil via HTTP restent bloqués par défaut, car ils ne déclarent pas les capacités du client.

## Utiliser l’outil

L’agent fournit deux chaînes obligatoires :

<ParamField path="title" type="string" required>
  Titre court affiché avec l’aperçu en ligne et comme titre du document hébergé.
</ParamField>

<ParamField path="widget_code" type="string" required>
  Fragment SVG ou HTML autonome. Une entrée commençant par `<svg` après suppression des espaces superflus est affichée en mode SVG ; toute autre entrée est traitée comme un fragment HTML. Longueur maximale : 262 144 caractères.
</ParamField>

Le résultat de l’outil comprend un identifiant d’aperçu Canvas, ce qui permet à la conversation Web d’afficher le widget directement à partir de l’appel de l’outil et de le restaurer après le rechargement de l’historique. Les transcriptions qui n’affichent pas les aperçus présentent néanmoins le chemin Canvas hébergé.

## Sécurité et stockage

Les documents des widgets utilisent une politique de sécurité du contenu restrictive : les styles et scripts intégrés sont autorisés, les images peuvent utiliser des URL `data:`, tandis que les récupérations externes et les chargements de ressources sont bloqués. Conservez l’ensemble du balisage, des styles, des scripts et des données d’image dans `widget_code`.

L’iframe omet toujours `allow-same-origin`, même lorsque le mode d’intégration global de l’interface de contrôle est `trusted`, afin que les scripts des widgets ne puissent pas lire l’origine de l’application parente. L’hôte Canvas fournit également les documents des widgets avec un en-tête de réponse `Content-Security-Policy: sandbox allow-scripts` ; ainsi, même lorsque l’URL hébergée est ouverte directement, le widget s’exécute dans une origine opaque plutôt que dans celle de l’interface de contrôle. Le bac à sable du navigateur n’empêche pas un script de faire naviguer sa propre iframe ; n’affichez que du code de widget que vous acceptez d’exécuter dans ce cadre isolé.

L’iframe respecte également [`gateway.controlUi.embedSandbox`](/fr/web/control-ui#hosted-embeds). Le niveau `scripts` par défaut prend en charge les widgets interactifs tout en préservant l’isolation de l’origine.

Canvas conserve au maximum 32 widgets par session (ou par agent lorsqu’aucune session n’est disponible). La création d’un widget supplémentaire supprime le document le plus ancien dans cette portée.

## Voir aussi

- [Intégrations hébergées de l’interface de contrôle](/fr/web/control-ui#hosted-embeds)
- [Plugin Canvas](/fr/plugins/reference/canvas)
- [Capacités des clients du protocole Gateway](/fr/gateway/protocol#client-capabilities)
