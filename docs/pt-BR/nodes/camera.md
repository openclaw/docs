---
read_when:
    - Adicionar ou modificar a captura da câmera em nós iOS/Android ou no macOS
    - Estendendo fluxos de trabalho de arquivos temporários MEDIA acessíveis por agentes
summary: 'Captura de câmera (nós iOS/Android + app para macOS) para uso por agentes: fotos (jpg) e clipes de vídeo curtos (mp4)'
title: Captura da câmera
x-i18n:
    generated_at: "2026-05-06T09:05:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 226b9f44e8d56b9b366d679c6c2f974c714afc4cb962afddba89d17dcdfc09eb
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw oferece suporte a **captura de câmera** para fluxos de trabalho de agentes:

- **Node iOS** (pareado via Gateway): capture uma **foto** (`jpg`) ou um **clipe de vídeo curto** (`mp4`, com áudio opcional) via `node.invoke`.
- **Node Android** (pareado via Gateway): capture uma **foto** (`jpg`) ou um **clipe de vídeo curto** (`mp4`, com áudio opcional) via `node.invoke`.
- **app macOS** (Node via Gateway): capture uma **foto** (`jpg`) ou um **clipe de vídeo curto** (`mp4`, com áudio opcional) via `node.invoke`.

Todo acesso à câmera é controlado por **configurações controladas pelo usuário**.

## Node iOS

### Configuração do usuário (ativada por padrão)

- Aba Configurações do iOS → **Câmera** → **Permitir Câmera** (`camera.enabled`)
  - Padrão: **ativado** (chave ausente é tratada como ativada).
  - Quando desativado: comandos `camera.*` retornam `CAMERA_DISABLED`.

### Comandos (via Gateway `node.invoke`)

- `camera.list`
  - Payload de resposta:
    - `devices`: array de `{ id, name, position, deviceType }`

- `camera.snap`
  - Parâmetros:
    - `facing`: `front|back` (padrão: `front`)
    - `maxWidth`: número (opcional; padrão `1600` no Node iOS)
    - `quality`: `0..1` (opcional; padrão `0.9`)
    - `format`: atualmente `jpg`
    - `delayMs`: número (opcional; padrão `0`)
    - `deviceId`: string (opcional; de `camera.list`)
  - Payload de resposta:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Proteção de payload: as fotos são recomprimidas para manter o payload base64 abaixo de 5 MB.

- `camera.clip`
  - Parâmetros:
    - `facing`: `front|back` (padrão: `front`)
    - `durationMs`: número (padrão `3000`, limitado a um máximo de `60000`)
    - `includeAudio`: booleano (padrão `true`)
    - `format`: atualmente `mp4`
    - `deviceId`: string (opcional; de `camera.list`)
  - Payload de resposta:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Requisito de primeiro plano

Como `canvas.*`, o Node iOS só permite comandos `camera.*` em **primeiro plano**. Invocações em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE`.

### Auxiliar da CLI (arquivos temporários + MEDIA)

A forma mais fácil de obter anexos é via o auxiliar da CLI, que grava a mídia decodificada em um arquivo temporário e imprime `MEDIA:<path>`.

Exemplos:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Notas:

- `nodes camera snap` usa por padrão **ambas** as orientações para dar ao agente as duas visualizações.
- Os arquivos de saída são temporários (no diretório temporário do SO), a menos que você crie seu próprio wrapper.

## Node Android

### Configuração de usuário do Android (ativada por padrão)

- Painel Configurações do Android → **Câmera** → **Permitir Câmera** (`camera.enabled`)
  - Padrão: **ativado** (chave ausente é tratada como ativada).
  - Quando desativado: comandos `camera.*` retornam `CAMERA_DISABLED`.

### Permissões

- O Android exige permissões de tempo de execução:
  - `CAMERA` para `camera.snap` e `camera.clip`.
  - `RECORD_AUDIO` para `camera.clip` quando `includeAudio=true`.

Se as permissões estiverem ausentes, o app solicitará quando possível; se negadas, as solicitações `camera.*` falharão com um erro
`*_PERMISSION_REQUIRED`.

### Requisito de primeiro plano do Android

Como `canvas.*`, o Node Android só permite comandos `camera.*` em **primeiro plano**. Invocações em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE`.

### Comandos do Android (via Gateway `node.invoke`)

- `camera.list`
  - Payload de resposta:
    - `devices`: array de `{ id, name, position, deviceType }`

### Proteção de payload

As fotos são recomprimidas para manter o payload base64 abaixo de 5 MB.

## app macOS

### Configuração do usuário (desativada por padrão)

O app complementar para macOS expõe uma caixa de seleção:

- **Configurações → Geral → Permitir Câmera** (`openclaw.cameraEnabled`)
  - Padrão: **desativado**
  - Quando desativado: solicitações da câmera retornam "Câmera desativada pelo usuário".

### Auxiliar da CLI (invocação do Node)

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

Notas:

- `openclaw nodes camera snap` usa `maxWidth=1600` por padrão, a menos que seja sobrescrito.
- No macOS, `camera.snap` aguarda `delayMs` (padrão 2000ms) após o aquecimento/estabilização da exposição antes de capturar.
- Payloads de foto são recomprimidos para manter o base64 abaixo de 5 MB.

## Segurança + limites práticos

- O acesso à câmera e ao microfone aciona as solicitações de permissão usuais do SO (e exige strings de uso no Info.plist).
- Clipes de vídeo são limitados (atualmente `<= 60s`) para evitar payloads de Node grandes demais (sobrecarga de base64 + limites de mensagem).

## Vídeo da tela no macOS (nível do SO)

Para vídeo de _tela_ (não da câmera), use o complementar para macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

Notas:

- Requer permissão de **Gravação de Tela** do macOS (TCC).

## Relacionado

- [Suporte a imagens e mídia](/pt-BR/nodes/images)
- [Entendimento de mídia](/pt-BR/nodes/media-understanding)
- [Comando de localização](/pt-BR/nodes/location-command)
