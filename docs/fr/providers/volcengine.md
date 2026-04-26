---
read_when:
    - Vous souhaitez utiliser Volcano Engine ou les modèles Doubao avec OpenClaw
    - Vous avez besoin de configurer la clé API Volcengine
    - Vous souhaitez utiliser la synthèse vocale Volcengine Speech
summary: Configuration de Volcano Engine (modèles Doubao, points de terminaison de code, et TTS Seed Speech)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-26T11:37:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7948a26cc898e125d445e9ae091704f5cf442266d29e712c0dcedbe0dc0cce7
    source_path: providers/volcengine.md
    workflow: 15
---

Le fournisseur Volcengine donne accès aux modèles Doubao et aux modèles tiers
hébergés sur Volcano Engine, avec des points de terminaison séparés pour les charges de travail générales et de code.
Le même Plugin intégré peut également enregistrer Volcengine Speech comme fournisseur de TTS.

| Détail     | Valeur                                                     |
| ---------- | ---------------------------------------------------------- |
| Fournisseurs | `volcengine` (général + TTS) + `volcengine-plan` (code)  |
| Authentification des modèles | `VOLCANO_ENGINE_API_KEY`                |
| Authentification TTS   | `VOLCENGINE_TTS_API_KEY` ou `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API        | Modèles compatibles OpenAI, TTS BytePlus Seed Speech       |

## Premiers pas

<Steps>
  <Step title="Définir la clé API">
    Exécutez l’onboarding interactif :

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Cela enregistre à la fois les fournisseurs général (`volcengine`) et de code (`volcengine-plan`) à partir d’une seule clé API.

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

| Fournisseur       | Point de terminaison                      | Cas d’usage    |
| ----------------- | ----------------------------------------- | -------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Modèles généraux |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modèles de code  |

<Note>
Les deux fournisseurs sont configurés à partir d’une seule clé API. La configuration les enregistre automatiquement tous les deux.
</Note>

## Catalogue intégré

<Tabs>
  <Tab title="Général (volcengine)">
    | Réf. de modèle                               | Nom                             | Entrée      | Contexte |
    | -------------------------------------------- | ------------------------------- | ----------- | -------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | texte, image | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | texte, image | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | texte, image | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | texte, image | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | texte, image | 128,000 |
  </Tab>
  <Tab title="Code (volcengine-plan)">
    | Réf. de modèle                                    | Nom                      | Entrée | Contexte |
    | ------------------------------------------------- | ------------------------ | ------ | -------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | texte  | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | texte  | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | texte  | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | texte  | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | texte  | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | texte  | 256,000 |
  </Tab>
</Tabs>

## Synthèse vocale

Le TTS Volcengine utilise l’API HTTP BytePlus Seed Speech et se configure
séparément de la clé API du modèle Doubao compatible OpenAI. Dans la console BytePlus,
ouvrez Seed Speech > Settings > API Keys et copiez la clé API, puis définissez :

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

Ensuite, activez-le dans `openclaw.json` :

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

Pour les cibles de note vocale, OpenClaw demande à Volcengine le format natif du fournisseur
`ogg_opus`. Pour les pièces jointes audio normales, il demande `mp3`. Les alias de fournisseur
`bytedance` et `doubao` pointent également vers le même fournisseur vocal.

L’identifiant de ressource par défaut est `seed-tts-1.0` car c’est celui que BytePlus accorde
aux clés API Seed Speech nouvellement créées dans le projet par défaut. Si votre projet
dispose du droit TTS 2.0, définissez `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
`VOLCANO_ENGINE_API_KEY` est destiné aux points de terminaison des modèles ModelArk/Doubao et n’est pas une
clé API Seed Speech. Le TTS nécessite une clé API Seed Speech provenant de la console BytePlus Speech,
ou un ancien couple AppID/jeton de Speech Console.
</Warning>

L’authentification héritée AppID/jeton reste prise en charge pour les anciennes applications Speech Console :

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

## Configuration avancée

<AccordionGroup>
  <Accordion title="Modèle par défaut après l’onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` définit actuellement
    `volcengine-plan/ark-code-latest` comme modèle par défaut tout en enregistrant également
    le catalogue général `volcengine`.
  </Accordion>

  <Accordion title="Comportement de repli du sélecteur de modèles">
    Pendant l’onboarding/la configuration de la sélection du modèle, le choix d’authentification Volcengine privilégie
    à la fois les lignes `volcengine/*` et `volcengine-plan/*`. Si ces modèles ne sont pas
    encore chargés, OpenClaw se replie sur le catalogue non filtré au lieu d’afficher un
    sélecteur limité au fournisseur vide.
  </Accordion>

  <Accordion title="Variables d’environnement pour les processus daemon">
    Si le Gateway s’exécute comme un daemon (launchd/systemd), assurez-vous que les variables d’environnement
    du modèle et du TTS telles que `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`,
    `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID`, et
    `VOLCENGINE_TTS_TOKEN` sont disponibles pour ce processus (par exemple dans
    `~/.openclaw/.env` ou via `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Lorsque OpenClaw s’exécute comme service en arrière-plan, les variables d’environnement définies dans votre
shell interactif ne sont pas automatiquement héritées. Voir la note ci-dessus sur le daemon.
</Warning>

## Lié

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de bascule.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de configuration pour les agents, les modèles et les fournisseurs.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et étapes de débogage.
  </Card>
  <Card title="FAQ" href="/fr/help/faq" icon="circle-question">
    Questions fréquentes sur la configuration d’OpenClaw.
  </Card>
</CardGroup>
