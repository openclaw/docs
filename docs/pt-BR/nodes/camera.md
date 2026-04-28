---
read_when:
    - Adicionando ou modificando captura de câmera em Nodes iOS/Android ou no macOS
    - Estendendo fluxos de arquivos temporários de MEDIA acessíveis ao agente
summary: 'Captura de câmera (Nodes iOS/Android + app macOS) para uso do agente: fotos (jpg) e videoclipes curtos (mp4)'
title: Captura de câmera
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T05:59:28Z"
  model: gpt-5.4
  provider: openai
  source_hash: 33e23a382cdcea57e20ab1466bf32e54dd17e3b7918841dbd6d3ebf59547ad93
  source_path: nodes/camera.md
  workflow: 15
---

O OpenClaw oferece suporte a **captura de câmera** para fluxos de trabalho do agente:

- **Node iOS** (pareado via Gateway): captura uma **foto** (`jpg`) ou um **videoclipe curto** (`mp4`, com áudio opcional) via `node.invoke`.
- **Node Android** (pareado via Gateway): captura uma **foto** (`jpg`) ou um **videoclipe curto** (`mp4`, com áudio opcional) via `node.invoke`.
- **app macOS** (Node via Gateway): captura uma **foto** (`jpg`) ou um **videoclipe curto** (`mp4`, com áudio opcional) via `node.invoke`.

Todo acesso à câmera é controlado por **configurações controladas pelo usuário**.

## Node iOS

### Configuração do usuário (ativada por padrão)

- Aba Configurações do iOS → **Camera** → **Allow Camera** (`camera.enabled`)
  - Padrão: **on** (chave ausente é tratada como ativada).
  - Quando desativado: comandos `camera.*` retornam `CAMERA_DISABLED`.

### Comandos (via Gateway `node.invoke`)

- `camera.list`
  - Payload de resposta:
    - `devices`: array de `{ id, name, position, deviceType }`

- `camera.snap`
  - Parâmetros:
    - `facing`: `front|back` (padrão: `front`)
    - `maxWidth`: number (opcional; padrão `1600` no Node iOS)
    - `quality`: `0..1` (opcional; padrão `0.9`)
    - `format`: atualmente `jpg`
    - `delayMs`: number (opcional; padrão `0`)
    - `deviceId`: string (opcional; vindo de `camera.list`)
  - Payload de resposta:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Proteção de payload: fotos são recomprimidas para manter o payload base64 abaixo de 5 MB.

- `camera.clip`
  - Parâmetros:
    - `facing`: `front|back` (padrão: `front`)
    - `durationMs`: number (padrão `3000`, limitado a no máximo `60000`)
    - `includeAudio`: boolean (padrão `true`)
    - `format`: atualmente `mp4`
    - `deviceId`: string (opcional; vindo de `camera.list`)
  - Payload de resposta:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Exigência de primeiro plano

Como `canvas.*`, o Node iOS só permite comandos `camera.*` em **primeiro plano**. Invocações em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE`.

### Auxiliar de CLI (arquivos temporários + MEDIA)

A maneira mais fácil de obter anexos é via o auxiliar de CLI, que grava a mídia decodificada em um arquivo temporário e imprime `MEDIA:<path>`.

Exemplos:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Observações:

- `nodes camera snap` usa por padrão **ambos** os lados para dar ao agente as duas visões.
- Os arquivos de saída são temporários (no diretório temporário do SO), a menos que você crie seu próprio wrapper.

## Node Android

### Configuração do usuário no Android (ativada por padrão)

- Painel de Configurações do Android → **Camera** → **Allow Camera** (`camera.enabled`)
  - Padrão: **on** (chave ausente é tratada como ativada).
  - Quando desativado: comandos `camera.*` retornam `CAMERA_DISABLED`.

### Permissões

- O Android exige permissões em runtime:
  - `CAMERA` para `camera.snap` e `camera.clip`.
  - `RECORD_AUDIO` para `camera.clip` quando `includeAudio=true`.

Se as permissões estiverem ausentes, o app exibirá o prompt quando possível; se forem negadas, solicitações `camera.*` falham com um
erro `*_PERMISSION_REQUIRED`.

### Exigência de primeiro plano no Android

Como `canvas.*`, o Node Android só permite comandos `camera.*` em **primeiro plano**. Invocações em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE`.

### Comandos Android (via Gateway `node.invoke`)

- `camera.list`
  - Payload de resposta:
    - `devices`: array de `{ id, name, position, deviceType }`

### Proteção de payload

Fotos são recomprimidas para manter o payload base64 abaixo de 5 MB.

## app macOS

### Configuração do usuário (desativada por padrão)

O app complementar do macOS expõe uma caixa de seleção:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Padrão: **off**
  - Quando desativado: solicitações de câmera retornam “Camera disabled by user”.

### Auxiliar de CLI (node invoke)

Use a CLI principal `openclaw` para invocar comandos de câmera no Node macOS.

Exemplos:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints MEDIA:<path> (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Observações:

- `openclaw nodes camera snap` usa por padrão `maxWidth=1600`, a menos que seja substituído.
- No macOS, `camera.snap` espera `delayMs` (padrão 2000ms) após o aquecimento/estabilização da exposição antes de capturar.
- Payloads de foto são recomprimidos para manter o base64 abaixo de 5 MB.

## Segurança + limites práticos

- O acesso à câmera e ao microfone aciona os prompts normais de permissão do SO (e exige usage strings em Info.plist).
- Videoclipes têm limite (atualmente `<= 60s`) para evitar payloads excessivos de Node (overhead de base64 + limites de mensagem).

## Vídeo de tela no macOS (nível do SO)

Para vídeo de _tela_ (não da câmera), use o app complementar do macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

Observações:

- Requer permissão do macOS para **Screen Recording** (TCC).

## Relacionado

- [Suporte a imagem e mídia](/pt-BR/nodes/images)
- [Entendimento de mídia](/pt-BR/nodes/media-understanding)
- [Comando de localização](/pt-BR/nodes/location-command)
