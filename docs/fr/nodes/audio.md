---
read_when:
    - Modification de la transcription audio ou de la gestion des médias
summary: Comment les notes audio/vocales entrantes sont téléchargées, transcrites et injectées dans les réponses
title: Notes audio et vocales
x-i18n:
    generated_at: "2026-07-12T15:34:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cb382f4219620d906bfa76ebddc690b174a3b24f80f815be92e915b363d17792
    source_path: nodes/audio.md
    workflow: 16
---

## Fonctionnement

Lorsque la compréhension audio est activée (ou détectée automatiquement), OpenClaw :

1. Localise la première pièce jointe audio (chemin local ou URL) et la télécharge si nécessaire.
2. Applique `maxBytes` avant l’envoi à chaque entrée de modèle.
3. Exécute dans l’ordre la première entrée de modèle admissible (fournisseur ou CLI) ; si une entrée échoue ou est ignorée (taille/délai d’expiration), l’entrée suivante est essayée.
4. En cas de réussite, remplace `Body` par un bloc `[Audio]` et définit `{{Transcript}}`.

Lorsque la transcription réussit, `CommandBody`/`RawBody` sont également définis sur la transcription afin que les commandes obliques continuent de fonctionner. Avec `--verbose`, les journaux indiquent le lancement de la transcription et le moment où elle remplace le corps.

## Détection automatique (par défaut)

Si vous n’avez configuré aucun modèle et que `tools.media.audio.enabled` n’est pas défini sur `false`, OpenClaw effectue la détection automatique dans l’ordre suivant et s’arrête à la première option fonctionnelle :

1. **Modèle de réponse actif**, lorsque son fournisseur prend en charge la compréhension audio.
2. **Authentification de fournisseur configurée** — toute entrée `models.providers.*` disposant d’une authentification pour un fournisseur prenant en charge la transcription audio. Cette vérification précède celle des CLI locales ; une clé d’API configurée est donc toujours prioritaire sur un binaire local dans `PATH`.
   Priorité des fournisseurs lorsque plusieurs sont configurés : Groq, OpenAI, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral.
3. **CLI locales** (uniquement si aucune authentification de fournisseur n’a été trouvée). OpenClaw crée une liste ordonnée de solutions de repli :
   - `whisper-cli`, avant les options CPU par défaut uniquement lorsqu’un appel de modèle antérieur dans le processus actuel a détecté Metal ou CUDA
   - `sherpa-onnx-offline` avec son fournisseur CPU par défaut (nécessite `SHERPA_ONNX_MODEL_DIR` contenant `tokens.txt`, `encoder.onnx`, `decoder.onnx` et `joiner.onnx`)
   - `whisper-cli` lorsque Metal/CUDA est uniquement pris en charge par la compilation ou que le backend sélectionné n’a autrement pas été observé
   - `parakeet-mlx` sur Apple Silicon (compatible MLX ; l’utilisation du périphérique reste non observée)
   - `whisper` (CLI Python ; télécharge automatiquement les modèles)

La provenance de l’installation ou du lien constitue une preuve de capacité, et non une preuve d’exécution. À elle seule, elle ne place jamais un candidat devant sherpa sur CPU. OpenClaw ne charge pas de modèle pendant la configuration ou les vérifications d’état uniquement pour sonder un backend.
Le whisper.cpp détecté automatiquement conserve ses journaux habituels d’exécution du modèle afin qu’OpenClaw puisse enregistrer la ligne amont `using … backend`. Les entrées CLI explicites conservent leurs indicateurs de sortie configurés.

La détection automatique de Gemini CLI pour la compréhension des médias a été remplacée par une solution de repli Antigravity CLI (`agy`) exécutée dans un bac à sable pour les images et les vidéos ; l’audio n’utilise aucune solution de repli CLI autre que les binaires locaux ci-dessus.

Pour désactiver la détection automatique, définissez `tools.media.audio.enabled: false`. Pour la personnaliser, définissez `tools.media.audio.models`.

<Note>
La détection des binaires est effectuée au mieux sous macOS/Linux/Windows. Assurez-vous que la CLI figure dans `PATH` (`~` est développé), ou définissez un modèle CLI explicite avec le chemin complet de la commande.
</Note>

Inspectez la sélection locale sans transcrire d’audio :

```bash
openclaw capability audio providers
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

L’inventaire des fournisseurs indique séparément la solution de repli locale retenue et la sélection globale du fournisseur, ainsi que les champs de backend pris en charge, demandé et observé. Après l’exécution de la transcription, `/status` indique le backend demandé ou observé dans la ligne des médias. Les entrées CLI explicites dans `tools.media.audio.models` contournent toujours la sélection automatique ; utilisez leurs indicateurs propres au backend, comme `--provider=cuda` pour sherpa ou `--no-gpu`/`--device` pour whisper.cpp.

## Exemples de configuration

### Fournisseur avec solution de repli CLI (OpenAI + CLI Whisper)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Fournisseur uniquement avec filtrage par portée

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

### Fournisseur uniquement (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### Fournisseur uniquement (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Fournisseur uniquement (SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### Renvoyer la transcription dans la discussion (activation explicite)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // la valeur par défaut est false
        echoFormat: '📝 "{transcript}"', // facultatif, prend en charge {transcript}
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

## Remarques et limites

- L’authentification du fournisseur suit l’ordre standard d’authentification des modèles (profils d’authentification, variables d’environnement, `models.providers.*.apiKey`).
- Détails de configuration de Groq : [Groq](/fr/providers/groq).
- Deepgram utilise `DEEPGRAM_API_KEY` lorsque `provider: "deepgram"` est employé. Détails de configuration : [Deepgram](/fr/providers/deepgram).
- Détails de configuration de Mistral : [Mistral](/fr/providers/mistral).
- SenseAudio utilise `SENSEAUDIO_API_KEY` lorsque `provider: "senseaudio"` est employé. Détails de configuration : [SenseAudio](/fr/providers/senseaudio).
- Les fournisseurs audio peuvent remplacer `baseUrl`, `headers` et `providerOptions` via `tools.media.audio`.
- La limite de taille par défaut est de 20MB (`tools.media.audio.maxBytes`). Un fichier audio dépassant cette taille est ignoré pour ce modèle et l’entrée suivante est essayée.
- Les fichiers audio de moins de 1024 octets sont ignorés avant la transcription par le fournisseur ou la CLI.
- La valeur par défaut de `maxChars` pour l’audio est **non définie** (transcription complète). Définissez `tools.media.audio.maxChars` ou un `maxChars` propre à une entrée pour tronquer la sortie.
- Le modèle par défaut de la détection automatique OpenAI est `gpt-4o-transcribe` ; définissez `model: "gpt-4o-mini-transcribe"` pour une option moins coûteuse et plus rapide.
- Utilisez `tools.media.audio.attachments` pour traiter plusieurs notes vocales (`mode: "all"` avec `maxAttachments`, valeur par défaut : 1).
- La transcription est accessible aux modèles sous la forme `{{Transcript}}`.
- `tools.media.audio.echoTranscript` est désactivé par défaut ; activez-le pour renvoyer une confirmation de transcription à la discussion d’origine avant le traitement par l’agent.
- `tools.media.audio.echoFormat` personnalise le texte renvoyé (espace réservé : `{transcript}` ; valeur par défaut : `📝 "{transcript}"`).
- La sortie standard de la CLI est limitée à 5MB ; veillez à ce que sa sortie reste concise.
- Les `args` de la CLI doivent utiliser `{{MediaPath}}` pour le chemin du fichier audio local. Exécutez `openclaw doctor --fix` pour migrer les espaces réservés obsolètes `{input}` provenant d’anciennes configurations `audio.transcription.command` (clé retirée : `audio.transcription`, remplacée par `tools.media.audio.models`).
- `tools.media.concurrency` limite les tâches multimédias ; ce n’est pas un ordonnanceur de GPU.

### Reconnaissance vocale locale résidente

La reconnaissance vocale locale détectée automatiquement continue de lancer un processus par requête. OpenClaw ne gère actuellement aucun serveur whisper.cpp résident, car le paquet Homebrew standard `whisper-cpp` désactive ce serveur, tandis que l’exemple amont ne comporte aucune file d’admission bornée configurée. Pour pouvoir être activé en toute sécurité, un cycle de vie résident géré par un Plugin nécessite un worker empaqueté et maintenu, avec gestion de l’état de santé et du démarrage, maintien du modèle en mémoire, mise en file d’attente bornée, annulation et délai d’expiration, fonctionnement sans authentification limité à l’interface de bouclage, et aucune solution de repli vers le cloud.

### Prise en charge de l’environnement de proxy

La transcription audio fondée sur un fournisseur respecte les variables d’environnement standard de proxy sortant, conformément à la sémantique de `EnvHttpProxyAgent` d’undici :

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

Les variables en minuscules sont prioritaires sur celles en majuscules ; les entrées `NO_PROXY`/`no_proxy` (noms d’hôtes, `*.suffix` ou `host:port`) contournent le proxy. Si aucune variable d’environnement de proxy n’est définie, une sortie directe est utilisée. Si la configuration du proxy échoue (URL mal formée), OpenClaw consigne un avertissement et revient à une récupération directe.

## Détection des mentions dans les groupes

Sur les canaux prenant en charge le contrôle préalable audio, OpenClaw transcrit l’audio **avant** de rechercher les mentions lorsque `requireMention: true` est défini pour une discussion de groupe. Une note vocale sans légende peut ainsi franchir le filtre des mentions lorsque sa transcription contient un motif de mention configuré. La documentation propre à chaque canal décrit les transports qui nécessitent plutôt une mention saisie.

**Fonctionnement :**

1. Si un message vocal ne comporte aucun corps textuel et que le groupe exige des mentions, OpenClaw effectue une transcription préalable de la première pièce jointe audio.
2. La transcription est vérifiée à la recherche de motifs de mention (par exemple `@BotName`, des déclencheurs emoji).
3. Si une mention est trouvée, le message passe par l’intégralité du pipeline de réponse.

**Comportement de repli :** si la transcription préalable échoue (délai d’expiration, erreur d’API, etc.), le message revient à une détection des mentions uniquement textuelle, afin que les messages mixtes (texte + audio) ne soient jamais supprimés.

**Désactivation par groupe/sujet Telegram :**

- Définissez `channels.telegram.groups.<chatId>.disableAudioPreflight: true` pour ignorer les vérifications préalables des mentions dans la transcription pour ce groupe.
- Définissez `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` pour remplacer ce réglage par sujet (`true` pour ignorer, `false` pour forcer l’activation).
- La valeur par défaut est `false` (contrôle préalable activé lorsque les conditions de filtrage par mention sont remplies).

**Exemple :** un utilisateur envoie une note vocale disant « Hé @Claude, quel temps fait-il ? » dans un groupe Telegram avec `requireMention: true`. La note vocale est transcrite, la mention est détectée et l’agent répond.

## Points d’attention

- Les règles de portée appliquent la première correspondance ; `chatType` est normalisé en `direct`, `group` ou `channel`.
- Assurez-vous que votre CLI se termine avec le code 0 et affiche du texte brut ; une sortie JSON doit être transformée avec `jq -r .text`.
- Les modes connus de sortie vers un fichier font autorité : un fichier de transcription déduit vide ou absent ne produit aucune transcription au lieu de revenir à la sortie de progression de la CLI.
- Pour `parakeet-mlx`, utilisez `--output-format txt` (ou `all`) avec `--output-dir` et le modèle de sortie par défaut `{filename}`. Les variables d’environnement amont `PARAKEET_OUTPUT_FORMAT` et `PARAKEET_OUTPUT_TEMPLATE` sont également prises en charge. OpenClaw lit `<output-dir>/<media-basename>.txt` ; le format `srt` par défaut, les autres formats et les modèles de sortie personnalisés continuent d’utiliser la sortie standard.
- Conservez des délais d’expiration raisonnables (`timeoutSeconds`, valeur par défaut : 60s) afin d’éviter de bloquer la file d’attente des réponses.
- La transcription préalable ne traite que la **première** pièce jointe audio pour la détection des mentions. Les pièces jointes audio supplémentaires sont traitées pendant la phase principale de compréhension des médias.

## Voir aussi

- [Compréhension des médias](/fr/nodes/media-understanding)
- [Mode conversation](/fr/nodes/talk)
- [Activation vocale](/fr/nodes/voicewake)
