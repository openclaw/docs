---
read_when:
    - Adicionando ou modificando a captura da câmera em nós iOS/Android ou macOS
    - Estendendo fluxos de trabalho de arquivos temporários de MÍDIA acessíveis por agentes
summary: 'Captura de câmera (nós iOS/Android + app macOS) para uso do agente: fotos (jpg) e clipes de vídeo curtos (mp4)'
title: Captura da câmera
x-i18n:
    generated_at: "2026-06-27T17:40:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cb02b1e0e5d68e537dc699bcabacfb48b7beaf07459bf47800810a721191795
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw oferece suporte a **captura de câmera** para fluxos de trabalho de agentes:

- **Nó iOS** (pareado via Gateway): capture uma **foto** (`jpg`) ou um **clipe de vídeo curto** (`mp4`, com áudio opcional) via `node.invoke`.
- **Nó Android** (pareado via Gateway): capture uma **foto** (`jpg`) ou um **clipe de vídeo curto** (`mp4`, com áudio opcional) via `node.invoke`.
- **App macOS** (nó via Gateway): capture uma **foto** (`jpg`) ou um **clipe de vídeo curto** (`mp4`, com áudio opcional) via `node.invoke`.

Todo acesso à câmera é protegido por **configurações controladas pelo usuário**.

## Nó iOS

### Configuração do usuário (ativada por padrão)

- Aba Settings do iOS → **Camera** → **Allow Camera** (`camera.enabled`)
  - Padrão: **ativado** (chave ausente é tratada como habilitada).
  - Quando desativado: comandos `camera.*` retornam `CAMERA_DISABLED`.

### Comandos (via Gateway `node.invoke`)

- `camera.list`
  - Payload de resposta:
    - `devices`: array de `{ id, name, position, deviceType }`

- `camera.snap`
  - Parâmetros:
    - `facing`: `front|back` (padrão: `front`)
    - `maxWidth`: number (opcional; padrão `1600` no nó iOS)
    - `quality`: `0..1` (opcional; padrão `0.9`)
    - `format`: atualmente `jpg`
    - `delayMs`: number (opcional; padrão `0`)
    - `deviceId`: string (opcional; de `camera.list`)
  - Payload de resposta:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Proteção de payload: fotos são recomprimidas para manter o payload base64 abaixo de 5 MB.

- `camera.clip`
  - Parâmetros:
    - `facing`: `front|back` (padrão: `front`)
    - `durationMs`: number (padrão `3000`, limitado a um máximo de `60000`)
    - `includeAudio`: boolean (padrão `true`)
    - `format`: atualmente `mp4`
    - `deviceId`: string (opcional; de `camera.list`)
  - Payload de resposta:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Requisito de primeiro plano

Assim como `canvas.*`, o nó iOS só permite comandos `camera.*` em **primeiro plano**. Invocações em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE`.

### Auxiliar da CLI

A maneira mais fácil de obter arquivos de mídia é via o auxiliar da CLI, que grava a mídia decodificada em um arquivo temporário e imprime o caminho salvo.

Exemplos:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Notas:

- `nodes camera snap` usa como padrão **ambas** as orientações para dar ao agente as duas visualizações.
- Os arquivos de saída são temporários (no diretório temporário do SO), a menos que você crie seu próprio wrapper.

## Nó Android

### Configuração do usuário Android (ativada por padrão)

- Painel Settings do Android → **Camera** → **Allow Camera** (`camera.enabled`)
  - Padrão: **ativado** (chave ausente é tratada como habilitada).
  - Quando desativado: comandos `camera.*` retornam `CAMERA_DISABLED`.

### Permissões

- Android exige permissões em tempo de execução:
  - `CAMERA` para `camera.snap` e `camera.clip`.
  - `RECORD_AUDIO` para `camera.clip` quando `includeAudio=true`.

Se as permissões estiverem ausentes, o app solicitará quando possível; se forem negadas, solicitações `camera.*` falharão com um erro
`*_PERMISSION_REQUIRED`.

### Requisito de primeiro plano no Android

Assim como `canvas.*`, o nó Android só permite comandos `camera.*` em **primeiro plano**. Invocações em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE`.

### Comandos Android (via Gateway `node.invoke`)

- `camera.list`
  - Payload de resposta:
    - `devices`: array de `{ id, name, position, deviceType }`

### Proteção de payload

Fotos são recomprimidas para manter o payload base64 abaixo de 5 MB.

## App macOS

### Configuração do usuário (desativada por padrão)

O app complementar para macOS expõe uma caixa de seleção:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Padrão: **desativado**
  - Quando desativado: solicitações de câmera retornam "Câmera desabilitada pelo usuário".

### Auxiliar da CLI (node invoke)

Use a CLI principal `openclaw` para invocar comandos de câmera no nó macOS.

Exemplos:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints saved path
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints saved path
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints saved path (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Notas:

- `openclaw nodes camera snap` usa `maxWidth=1600` como padrão, a menos que seja substituído.
- No macOS, `camera.snap` aguarda `delayMs` (padrão 2000ms) após o aquecimento/estabilização da exposição antes de capturar.
- Payloads de foto são recomprimidos para manter base64 abaixo de 5 MB.

## Segurança + limites práticos

- O acesso à câmera e ao microfone aciona os prompts de permissão usuais do SO (e exige strings de uso em Info.plist).
- Clipes de vídeo são limitados (atualmente `<= 60s`) para evitar payloads de nó grandes demais (sobrecarga de base64 + limites de mensagem).

## Vídeo de tela no macOS (nível do SO)

Para vídeo de _tela_ (não câmera), use o complementar para macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints saved path
```

Notas:

- Exige permissão de **Screen Recording** do macOS (TCC).

## Relacionados

- [Suporte a imagens e mídia](/pt-BR/nodes/images)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Comando de localização](/pt-BR/nodes/location-command)
