---
read_when:
    - Vous souhaitez utiliser les modèles Volcano Engine ou Doubao avec OpenClaw
    - Vous devez configurer la clé API de Volcengine
    - Vous souhaitez utiliser la synthèse vocale de Volcengine Speech
summary: Configuration de Volcano Engine (modèles Doubao, points de terminaison de codage et synthèse vocale Seed Speech)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-07-12T03:04:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e853a1c8847704caedf0ec83c38332569f72105c5e34ad973daf614a2e80550b
    source_path: providers/volcengine.md
    workflow: 16
---

Le fournisseur Volcengine donne accès aux modèles Doubao et aux modèles tiers hébergés sur Volcano Engine, avec des points de terminaison distincts pour les charges de travail générales et de programmation. Le même plugin intégré enregistre également Volcengine Speech comme fournisseur TTS.

| Détail         | Valeur                                                     |
| -------------- | ---------------------------------------------------------- |
| Fournisseurs   | `volcengine` (général + TTS), `volcengine-plan` (programmation) |
| Auth. modèles  | `VOLCANO_ENGINE_API_KEY`                                   |
| Auth. TTS      | `VOLCENGINE_TTS_API_KEY` ou `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API            | Modèles compatibles avec OpenAI, TTS BytePlus Seed Speech  |

## Bien démarrer

<Steps>
  <Step title="Définir la clé API">
    Exécutez la configuration initiale interactive :

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Cette commande enregistre les fournisseurs général (`volcengine`) et de programmation (`volcengine-plan`) à partir d’une seule clé API.

  </Step>
  <Step title="Définir un modèle par défaut">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Pour une configuration non interactive (CI, scripts), transmettez directement la clé :

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Fournisseurs et points de terminaison

| Fournisseur       | Point de terminaison                       | Cas d’utilisation       |
| ----------------- | ------------------------------------------ | ----------------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`         | Modèles généraux        |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3`  | Modèles de programmation |

<Note>
Les deux fournisseurs sont configurés à partir d’une seule clé API. La configuration les enregistre automatiquement, et le sélecteur de modèles du fournisseur de programmation réutilise également l’authentification du fournisseur général (`volcengine-plan` est un alias d’authentification de `volcengine`).
</Note>

## Catalogue intégré

<Tabs>
  <Tab title="Général (volcengine)">
    | Référence du modèle                         | Nom                             | Entrée       | Contexte |
    | ------------------------------------------- | ------------------------------- | ------------ | -------- |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | texte, image | 128,000  |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | texte, image | 256,000  |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | texte, image | 256,000  |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | texte, image | 200,000  |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | texte, image | 256,000  |
  </Tab>
  <Tab title="Programmation (volcengine-plan)">
    | Référence du modèle                              | Nom                      | Entrée | Contexte |
    | ------------------------------------------------ | ------------------------ | ------ | -------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | texte  | 256,000  |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | texte  | 256,000  |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | texte  | 256,000  |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | texte  | 200,000  |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | texte  | 256,000  |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | texte  | 256,000  |
  </Tab>
</Tabs>

Les deux catalogues sont statiques (aucun appel de découverte à `/models`) et prennent en charge la comptabilisation de l’utilisation en flux continu compatible avec OpenAI. Les schémas d’outils des deux fournisseurs suppriment automatiquement les mots-clés `minLength`, `maxLength`, `minItems`, `maxItems`, `minContains` et `maxContains`, car l’API d’appel d’outils de Volcengine les rejette.

## Synthèse vocale

Le TTS Volcengine utilise l’API HTTP BytePlus Seed Speech (`voice.ap-southeast-1.bytepluses.com`) et se configure séparément de la clé API des modèles Doubao compatibles avec OpenAI. Dans la console BytePlus, ouvrez Seed Speech > Settings > API Keys, copiez la clé API, puis définissez :

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

Activez-le ensuite dans `openclaw.json` :

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

Champs disponibles sous `messages.tts.providers.volcengine` : `apiKey`, `voice`, `speedRatio` (0.2-3.0), `emotion`, `cluster`, `resourceId`, `appKey` et `baseUrl`. `!emotion=<value>` fonctionne également comme directive vocale en ligne lorsque les remplacements des paramètres vocaux sont autorisés.

Pour les destinations de type message vocal, OpenClaw demande le format natif du fournisseur `ogg_opus`. Pour les pièces jointes audio ordinaires, il demande `mp3`. Les alias de fournisseur `bytedance` et `doubao` correspondent également à ce fournisseur de synthèse vocale.

L’identifiant de ressource par défaut est `seed-tts-1.0`, l’autorisation que BytePlus accorde par défaut aux nouvelles clés API Seed Speech. Si votre projet dispose de l’autorisation TTS 2.0, définissez `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
`VOLCANO_ENGINE_API_KEY` est destiné aux points de terminaison des modèles ModelArk/Doubao et n’est pas une clé API Seed Speech. Le TTS nécessite une clé API Seed Speech provenant de la console BytePlus Speech, ou une ancienne paire AppID/jeton de la console Speech.
</Warning>

L’ancienne authentification par AppID/jeton reste prise en charge pour les applications plus anciennes de la console Speech :

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

Autres variables d’environnement TTS facultatives : lorsqu’elles sont définies, `VOLCENGINE_TTS_VOICE`, `VOLCENGINE_TTS_APP_KEY` et `VOLCENGINE_TTS_BASE_URL` remplacent les champs de configuration correspondants de `messages.tts.providers.volcengine`.

## Configuration avancée

<AccordionGroup>
  <Accordion title="Modèle par défaut après la configuration initiale">
    `openclaw onboard --auth-choice volcengine-api-key` définit `volcengine-plan/ark-code-latest` comme modèle par défaut tout en enregistrant également le catalogue général `volcengine`.
  </Accordion>

  <Accordion title="Comportement de repli du sélecteur de modèles">
    Pendant la sélection du modèle lors de la configuration initiale ou de la configuration, le choix d’authentification Volcengine privilégie les entrées `volcengine/*` et `volcengine-plan/*`. Si ces modèles ne sont pas encore chargés, OpenClaw se replie sur le catalogue non filtré au lieu d’afficher un sélecteur vide limité au fournisseur.
  </Accordion>

  <Accordion title="Variables d’environnement des processus démons">
    Si le Gateway s’exécute en tant que démon (launchd/systemd), assurez-vous que les variables d’environnement des modèles et du TTS, telles que `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`, `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` et `VOLCENGINE_TTS_TOKEN`, sont accessibles à ce processus (par exemple dans `~/.openclaw/.env` ou via `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Lorsque OpenClaw s’exécute en tant que service d’arrière-plan, les variables d’environnement définies dans votre shell interactif ne sont pas automatiquement héritées. Consultez la remarque ci-dessus concernant les démons.
</Warning>

## Ressources associées

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de la configuration des agents, des modèles et des fournisseurs.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et étapes de débogage.
  </Card>
  <Card title="FAQ" href="/fr/help/faq" icon="circle-question">
    Questions fréquentes sur la configuration d’OpenClaw.
  </Card>
</CardGroup>
