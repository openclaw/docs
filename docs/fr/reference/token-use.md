---
read_when:
    - Explication de l'utilisation des jetons, des coûts ou des fenêtres de contexte
    - Débogage de la croissance du contexte ou du comportement de Compaction
summary: Comment OpenClaw construit le contexte d'invite et affiche l'utilisation des jetons + les coûts
title: Utilisation des jetons et coûts
x-i18n:
    generated_at: "2026-04-26T11:38:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 828b282103902f55d65ce820c17753c2602169eff068bcea36e629759002f28d
    source_path: reference/token-use.md
    workflow: 15
---

# Utilisation des jetons et coûts

OpenClaw suit les **jetons**, pas les caractères. Les jetons dépendent du modèle, mais la plupart des
modèles de style OpenAI comptent en moyenne ~4 caractères par jeton pour le texte anglais.

## Comment l'invite système est construite

OpenClaw assemble sa propre invite système à chaque exécution. Elle inclut :

- Liste des outils + courtes descriptions
- Liste des Skills (métadonnées uniquement ; les instructions sont chargées à la demande avec `read`).
  Le bloc compact des Skills est limité par `skills.limits.maxSkillsPromptChars`,
  avec une surcharge facultative par agent dans
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instructions d'auto-mise à jour
- Espace de travail + fichiers d'amorçage (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quand il est nouveau, ainsi que `MEMORY.md` lorsqu'il est présent). Le fichier racine en minuscules `memory.md` n'est pas injecté ; c'est une entrée de réparation héritée pour `openclaw doctor --fix` lorsqu'il est associé à `MEMORY.md`. Les fichiers volumineux sont tronqués par `agents.defaults.bootstrapMaxChars` (par défaut : 12000), et l'injection totale d'amorçage est plafonnée par `agents.defaults.bootstrapTotalMaxChars` (par défaut : 60000). Les fichiers quotidiens `memory/*.md` ne font pas partie de l'invite d'amorçage normale ; ils restent accessibles à la demande via les outils mémoire lors des tours ordinaires, mais `/new` et `/reset` sans argument peuvent préfixer un bloc ponctuel de contexte de démarrage avec la mémoire quotidienne récente pour ce premier tour. Ce préambule de démarrage est contrôlé par `agents.defaults.startupContext`.
- Heure (UTC + fuseau horaire de l'utilisateur)
- Balises de réponse + comportement Heartbeat
- Métadonnées d'exécution (hôte/OS/modèle/thinking)

Consultez la ventilation complète dans [System Prompt](/fr/concepts/system-prompt).

## Ce qui compte dans la fenêtre de contexte

Tout ce que le modèle reçoit compte dans la limite de contexte :

- Invite système (toutes les sections listées ci-dessus)
- Historique de conversation (messages utilisateur + assistant)
- Appels d'outils et résultats d'outils
- Pièces jointes/transcriptions (images, audio, fichiers)
- Résumés de Compaction et artefacts d'élagage
- Enveloppes fournisseur ou en-têtes de sécurité (non visibles, mais tout de même comptés)

Certaines surfaces lourdes à l'exécution ont leurs propres plafonds explicites :

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Les surcharges par agent se trouvent sous `agents.list[].contextLimits`. Ces réglages
servent aux extraits bornés à l'exécution et aux blocs injectés appartenant à l'exécution.
Ils sont distincts des limites d'amorçage, des limites de contexte de démarrage et des limites
d'invite des Skills.

Pour les images, OpenClaw réduit la taille des charges utiles d'image de transcription/d'outil avant les appels fournisseur.
Utilisez `agents.defaults.imageMaxDimensionPx` (par défaut : `1200`) pour ajuster cela :

- Des valeurs plus faibles réduisent généralement l'utilisation des jetons de vision et la taille des charges utiles.
- Des valeurs plus élevées conservent davantage de détails visuels pour l'OCR/les captures d'écran d'interface chargées.

Pour une ventilation pratique (par fichier injecté, outils, Skills et taille de l'invite système), utilisez `/context list` ou `/context detail`. Voir [Context](/fr/concepts/context).

## Comment voir l'utilisation actuelle des jetons

Utilisez ces commandes dans le chat :

- `/status` → **carte d'état riche en emoji** avec le modèle de session, l'utilisation du contexte,
  les jetons d'entrée/sortie de la dernière réponse et le **coût estimé** (clé API uniquement).
- `/usage off|tokens|full` → ajoute un **pied de page d'utilisation par réponse** à chaque réponse.
  - Persistant par session (stocké comme `responseUsage`).
  - L'authentification OAuth **masque le coût** (jetons uniquement).
- `/usage cost` → affiche un résumé local des coûts à partir des journaux de session OpenClaw.

Autres surfaces :

- **TUI/Web TUI :** `/status` + `/usage` sont pris en charge.
- **CLI :** `openclaw status --usage` et `openclaw channels list` affichent
  les fenêtres de quota fournisseur normalisées (`X% restants`, pas les coûts par réponse).
  Fournisseurs actuels avec fenêtre d'utilisation : Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi et z.ai.

Les surfaces d'utilisation normalisent les alias courants des champs natifs fournisseur avant affichage.
Pour le trafic OpenAI-family Responses, cela inclut à la fois `input_tokens` /
`output_tokens` et `prompt_tokens` / `completion_tokens`, afin que les noms de champs spécifiques au transport
ne changent pas `/status`, `/usage` ni les résumés de session.
L'utilisation JSON Gemini CLI est également normalisée : le texte de réponse provient de `response`, et
`stats.cached` correspond à `cacheRead`, avec `stats.input_tokens - stats.cached`
utilisé lorsque le CLI omet un champ explicite `stats.input`.
Pour le trafic natif OpenAI-family Responses, les alias d'utilisation WebSocket/SSE sont
normalisés de la même manière, et les totaux reviennent à l'entrée + sortie normalisées lorsque
`total_tokens` est absent ou vaut `0`.
Lorsque l'instantané de la session actuelle est parcimonieux, `/status` et `session_status` peuvent
également récupérer les compteurs de jetons/cache et l'étiquette du modèle d'exécution actif depuis le
journal d'utilisation de transcription le plus récent. Les valeurs actives non nulles existantes gardent
toujours la priorité sur les valeurs de repli issues de la transcription, et les totaux de transcription
plus élevés orientés invite peuvent l'emporter lorsque les totaux stockés sont absents ou plus faibles.
L'authentification d'utilisation pour les fenêtres de quota fournisseur provient de hooks spécifiques au fournisseur lorsqu'ils sont
disponibles ; sinon OpenClaw revient à la correspondance des identifiants OAuth/clé API
à partir des profils d'authentification, de l'environnement ou de la configuration.
Les entrées de transcription de l'assistant persistent la même forme d'utilisation normalisée, y compris
`usage.cost` lorsque le modèle actif a une tarification configurée et que le fournisseur
renvoie des métadonnées d'utilisation. Cela fournit à `/usage cost` et à l'état de session basé sur la transcription
une source stable même après la disparition de l'état actif de l'exécution.

OpenClaw conserve la comptabilité d'utilisation fournisseur séparée de l'instantané du contexte actuel.
Le `usage.total` du fournisseur peut inclure l'entrée mise en cache, la sortie et plusieurs appels de modèle dans une boucle d'outils ; il est donc utile pour le coût et la télémétrie, mais peut surestimer la fenêtre de contexte active. Les affichages et diagnostics de contexte utilisent le dernier instantané d'invite (`promptTokens`, ou le dernier appel de modèle lorsqu'aucun instantané d'invite n'est disponible) pour `context.used`.

## Estimation du coût (lorsqu'elle est affichée)

Les coûts sont estimés à partir de votre configuration de tarification des modèles :

```
models.providers.<provider>.models[].cost
```

Il s'agit de **USD par 1M de jetons** pour `input`, `output`, `cacheRead` et
`cacheWrite`. Si la tarification est absente, OpenClaw affiche uniquement les jetons. Les jetons OAuth
n'affichent jamais de coût en dollars.

## Impact du TTL du cache et de l'élagage

La mise en cache des invites fournisseur ne s'applique que dans la fenêtre TTL du cache. OpenClaw peut
exécuter en option un **élagage de TTL de cache** : il élague la session une fois le TTL du cache expiré,
puis réinitialise la fenêtre de cache afin que les requêtes suivantes puissent réutiliser le contexte fraîchement
mis en cache au lieu de remettre en cache l'historique complet. Cela réduit les coûts d'écriture de cache
lorsqu'une session reste inactive au-delà du TTL.

Configurez cela dans [Gateway configuration](/fr/gateway/configuration) et consultez les détails du comportement dans [Session pruning](/fr/concepts/session-pruning).

Heartbeat peut garder le cache **chaud** pendant les périodes d'inactivité. Si le TTL de cache de votre modèle
est de `1h`, définir l'intervalle Heartbeat juste en dessous (par exemple `55m`) peut éviter de remettre en cache
l'invite complète, réduisant ainsi les coûts d'écriture de cache.

Dans les configurations multi-agents, vous pouvez conserver une configuration de modèle partagée et ajuster le comportement du cache
par agent avec `agents.list[].params.cacheRetention`.

Pour un guide complet réglage par réglage, voir [Prompt Caching](/fr/reference/prompt-caching).

Pour la tarification API Anthropic, les lectures de cache sont significativement moins chères que les jetons
d'entrée, tandis que les écritures de cache sont facturées avec un multiplicateur plus élevé. Consultez la tarification
de mise en cache des invites d'Anthropic pour les derniers tarifs et multiplicateurs TTL :
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Exemple : garder un cache de 1h chaud avec Heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Exemple : trafic mixte avec stratégie de cache par agent

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # référence par défaut pour la plupart des agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # garde le cache long chaud pour les sessions profondes
    - id: "alerts"
      params:
        cacheRetention: "none" # évite les écritures de cache pour les notifications en rafale
```

`agents.list[].params` se fusionne au-dessus de `params` du modèle sélectionné ; vous pouvez donc
surcharger uniquement `cacheRetention` et hériter des autres valeurs par défaut du modèle sans changement.

### Exemple : activer l'en-tête bêta de contexte Anthropic 1M

La fenêtre de contexte Anthropic 1M est actuellement protégée par une bêta. OpenClaw peut injecter la
valeur `anthropic-beta` requise lorsque vous activez `context1m` sur les modèles Opus
ou Sonnet pris en charge.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Cela correspond à l'en-tête bêta `context-1m-2025-08-07` d'Anthropic.

Cela ne s'applique que lorsque `context1m: true` est défini sur cette entrée de modèle.

Condition requise : l'identifiant doit être éligible à l'utilisation de contexte long. Sinon,
Anthropic renvoie une erreur de limitation côté fournisseur pour cette requête.

Si vous authentifiez Anthropic avec des jetons OAuth/d'abonnement (`sk-ant-oat-*`),
OpenClaw ignore l'en-tête bêta `context-1m-*` car Anthropic rejette actuellement
cette combinaison avec HTTP 401.

## Conseils pour réduire la pression sur les jetons

- Utilisez `/compact` pour résumer les longues sessions.
- Réduisez les sorties d'outils volumineuses dans vos workflows.
- Abaissez `agents.defaults.imageMaxDimensionPx` pour les sessions riches en captures d'écran.
- Gardez des descriptions de Skills courtes (la liste des Skills est injectée dans l'invite).
- Préférez des modèles plus petits pour le travail exploratoire verbeux.

Voir [Skills](/fr/tools/skills) pour la formule exacte de surcharge de la liste des Skills.

## Lié

- [API usage and costs](/fr/reference/api-usage-costs)
- [Prompt caching](/fr/reference/prompt-caching)
- [Usage tracking](/fr/concepts/usage-tracking)
