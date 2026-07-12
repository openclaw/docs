---
read_when:
    - Adição ou modificação da captura da câmera em Nodes iOS/Android ou no macOS
    - Estendendo os fluxos de trabalho de arquivos temporários de MEDIA acessíveis pelo agente
summary: 'Captura da câmera (nodes iOS/Android + aplicativo para macOS) para uso pelo agente: fotos (jpg) e clipes de vídeo curtos (mp4)'
title: Captura da câmera
x-i18n:
    generated_at: "2026-07-12T15:23:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

O OpenClaw oferece suporte à captura pela câmera em fluxos de trabalho de agentes em nodes **iOS**, **Android** e **macOS** emparelhados: capture uma foto (`jpg`) ou um clipe de vídeo curto (`mp4`, com áudio opcional) via `node.invoke` do Gateway.

Todo acesso à câmera é controlado por uma configuração definida pelo usuário em cada plataforma.

## Node iOS

### Configuração do usuário no iOS

- Aba Settings do iOS → **Camera** → **Allow Camera** (`camera.enabled`).
  - Padrão: **ativado** (a ausência da chave é tratada como ativado).
  - Quando desativado: os comandos `camera.*` retornam `CAMERA_DISABLED`.

### Comandos do iOS (via `node.invoke` do Gateway)

- `camera.list`
  - Payload da resposta: `devices` — matriz de `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parâmetros:
    - `facing`: `front|back` (padrão: `front`)
    - `maxWidth`: número (opcional; padrão `1600`)
    - `quality`: `0..1` (opcional; padrão `0.9`, limitado a `[0.05, 1.0]`)
    - `format`: atualmente `jpg`
    - `delayMs`: número (opcional; padrão `0`, limitado internamente a `10000`)
    - `deviceId`: string (opcional; obtida de `camera.list`)
  - Payload da resposta: `format: "jpg"`, `base64`, `width`, `height`.
  - Proteção do payload: as fotos são recomprimidas para manter o payload codificado em base64 abaixo de 5MB.

- `camera.clip`
  - Parâmetros:
    - `facing`: `front|back` (padrão: `front`)
    - `durationMs`: número (padrão `3000`, limitado a `[250, 60000]`)
    - `includeAudio`: booleano (padrão `true`)
    - `format`: atualmente `mp4`
    - `deviceId`: string (opcional; obtida de `camera.list`)
  - Payload da resposta: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### Requisito de primeiro plano no iOS

Assim como `canvas.*`, o node iOS permite comandos `camera.*` apenas em **primeiro plano**. Invocações em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE`.

### Auxiliar da CLI

A maneira mais fácil de obter arquivos de mídia é usar o auxiliar da CLI, que grava a mídia decodificada em um arquivo temporário e exibe o caminho salvo.

```bash
openclaw nodes camera snap --node <id>                 # padrão: câmeras frontal + traseira (2 linhas MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Por padrão, `nodes camera snap` usa `--facing both`, capturando as câmeras frontal e traseira para fornecer ambas as perspectivas ao agente; use `--device-id` com uma única orientação explícita (`both` é rejeitado quando `--device-id` está definido). Os arquivos de saída são temporários (no diretório temporário do sistema operacional), a menos que você crie seu próprio wrapper.

## Node Android

### Configuração do usuário no Android

- Painel Settings do Android → **Camera** → **Allow Camera** (`camera.enabled`).
  - **Novas instalações têm o padrão desativado.** Instalações existentes anteriores a essa configuração são migradas para **ativado**, para que atualizações não removam silenciosamente um acesso à câmera que funcionava antes.
  - Quando desativado: os comandos `camera.*` retornam `CAMERA_DISABLED: enable Camera in Settings`.

### Permissões

- `CAMERA` é necessária para `camera.snap` e `camera.clip`; uma permissão ausente ou negada retorna `CAMERA_PERMISSION_REQUIRED`.
- `RECORD_AUDIO` é necessária para `camera.clip` quando `includeAudio` é `true`; uma permissão ausente ou negada retorna `MIC_PERMISSION_REQUIRED`.

O aplicativo solicita permissões em tempo de execução quando possível.

### Requisito de primeiro plano no Android

Assim como `canvas.*`, o node Android permite comandos `camera.*` apenas em **primeiro plano**. Invocações em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Comandos do Android (via `node.invoke` do Gateway)

- `camera.list`
  - Payload da resposta: `devices` — matriz de `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parâmetros: `facing` (`front|back`, padrão `front`), `quality` (padrão `0.95`, limitado a `[0.1, 1.0]`), `maxWidth` (padrão `1600`), `deviceId` (opcional; um id desconhecido falha com `INVALID_REQUEST`).
  - Payload da resposta: `format: "jpg"`, `base64`, `width`, `height`.
  - Proteção do payload: recomprimido para manter o base64 abaixo de 5MB (o mesmo limite do iOS).

- `camera.clip`
  - Parâmetros: `facing` (padrão `front`), `durationMs` (padrão `3000`, limitado a `[200, 60000]`), `includeAudio` (padrão `true`), `deviceId` (opcional).
  - Payload da resposta: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Proteção do payload: o MP4 bruto é limitado a 18MB antes da codificação em base64; clipes que excedem o limite falham com `PAYLOAD_TOO_LARGE` (reduza `durationMs` e tente novamente).

## Aplicativo para macOS

### Configuração do usuário no macOS

O aplicativo complementar para macOS disponibiliza uma caixa de seleção:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - Padrão: **desativado**.
  - Quando desativado: as solicitações de câmera retornam `CAMERA_DISABLED: enable Camera in Settings`.

### Auxiliar da CLI (invocação do node)

Use a CLI principal `openclaw` para invocar comandos de câmera no node macOS.

```bash
openclaw nodes camera list --node <id>                     # lista os ids das câmeras
openclaw nodes camera snap --node <id>                     # exibe o caminho salvo
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # exibe o caminho salvo
openclaw nodes camera clip --node <id> --duration-ms 3000   # exibe o caminho salvo (flag legada)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- `openclaw nodes camera snap` usa `maxWidth=1600` por padrão, salvo quando substituído.
- `camera.snap` aguarda `delayMs` (padrão 2000ms, limitado a `[0, 10000]`) após a estabilização do aquecimento e da exposição antes de capturar.
- Os payloads de fotos são recomprimidos para manter o base64 abaixo de 5MB.

## Segurança + limites práticos

- O acesso à câmera e ao microfone aciona as solicitações de permissão habituais do sistema operacional (e exige strings de uso em `Info.plist`).
- Os clipes de vídeo são limitados a 60s para evitar payloads de node excessivamente grandes (sobrecarga do base64 somada aos limites de mensagens).

## Vídeo da tela no macOS (nível do sistema operacional)

Para vídeo da _tela_ (não da câmera), use o aplicativo complementar para macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # exibe o caminho salvo
```

Requer a permissão **Screen Recording** do macOS (TCC).

## Relacionados

- [Suporte a imagens e mídia](/pt-BR/nodes/images)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Comando de localização](/pt-BR/nodes/location-command)
