---
read_when:
    - Como adicionar ou modificar a captura da câmera em nós iOS/Android ou no macOS
    - Estendendo os fluxos de trabalho de arquivos temporários de MEDIA acessíveis pelo agente
summary: 'Captura da câmera (Nodes iOS/Android + aplicativo para macOS) para uso pelo agente: fotos (jpg) e clipes de vídeo curtos (mp4)'
title: Captura da câmera
x-i18n:
    generated_at: "2026-07-12T00:01:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw oferece suporte à captura pela câmera para fluxos de trabalho de agentes em Nodes **iOS**, **Android** e **macOS** pareados: capture uma foto (`jpg`) ou um clipe de vídeo curto (`mp4`, com áudio opcional) por meio de `node.invoke` do Gateway.

Todo acesso à câmera é controlado por uma configuração definida pelo usuário em cada plataforma.

## Node iOS

### Configuração do usuário no iOS

- Aba Settings do iOS → **Camera** → **Allow Camera** (`camera.enabled`).
  - Padrão: **ativado** (a ausência da chave é tratada como ativado).
  - Quando desativado: os comandos `camera.*` retornam `CAMERA_DISABLED`.

### Comandos do iOS (via `node.invoke` do Gateway)

- `camera.list`
  - Conteúdo da resposta: `devices` — matriz de `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parâmetros:
    - `facing`: `front|back` (padrão: `front`)
    - `maxWidth`: número (opcional; padrão `1600`)
    - `quality`: `0..1` (opcional; padrão `0.9`, limitado ao intervalo `[0.05, 1.0]`)
    - `format`: atualmente `jpg`
    - `delayMs`: número (opcional; padrão `0`, limitado internamente a `10000`)
    - `deviceId`: string (opcional; obtida de `camera.list`)
  - Conteúdo da resposta: `format: "jpg"`, `base64`, `width`, `height`.
  - Proteção do conteúdo: as fotos são recomprimidas para manter o conteúdo codificado em base64 abaixo de 5 MB.

- `camera.clip`
  - Parâmetros:
    - `facing`: `front|back` (padrão: `front`)
    - `durationMs`: número (padrão `3000`, limitado ao intervalo `[250, 60000]`)
    - `includeAudio`: booleano (padrão `true`)
    - `format`: atualmente `mp4`
    - `deviceId`: string (opcional; obtida de `camera.list`)
  - Conteúdo da resposta: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### Requisito de primeiro plano no iOS

Assim como `canvas.*`, o Node iOS só permite comandos `camera.*` em **primeiro plano**. Invocações em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE`.

### Auxiliar da CLI

A maneira mais fácil de obter arquivos de mídia é usar o auxiliar da CLI, que grava a mídia decodificada em um arquivo temporário e exibe o caminho salvo.

```bash
openclaw nodes camera snap --node <id>                 # padrão: câmera frontal + traseira (2 linhas MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Por padrão, `nodes camera snap` usa `--facing both`, capturando com as câmeras frontal e traseira para fornecer ao agente ambas as perspectivas; use `--device-id` com uma única orientação explícita (`both` é rejeitado quando `--device-id` está definido). Os arquivos de saída são temporários (no diretório temporário do sistema operacional), a menos que você crie seu próprio wrapper.

## Node Android

### Configuração do usuário no Android

- Painel Settings do Android → **Camera** → **Allow Camera** (`camera.enabled`).
  - **Em instalações novas, o padrão é desativado.** Instalações existentes anteriores a essa configuração são migradas para **ativado**, para que as atualizações não removam silenciosamente um acesso à câmera que funcionava antes.
  - Quando desativado: os comandos `camera.*` retornam `CAMERA_DISABLED: enable Camera in Settings`.

### Permissões

- `CAMERA` é necessária para `camera.snap` e `camera.clip`; uma permissão ausente ou negada retorna `CAMERA_PERMISSION_REQUIRED`.
- `RECORD_AUDIO` é necessária para `camera.clip` quando `includeAudio` é `true`; uma permissão ausente ou negada retorna `MIC_PERMISSION_REQUIRED`.

O aplicativo solicita permissões durante a execução quando possível.

### Requisito de primeiro plano no Android

Assim como `canvas.*`, o Node Android só permite comandos `camera.*` em **primeiro plano**. Invocações em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Comandos do Android (via `node.invoke` do Gateway)

- `camera.list`
  - Conteúdo da resposta: `devices` — matriz de `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parâmetros: `facing` (`front|back`, padrão `front`), `quality` (padrão `0.95`, limitado ao intervalo `[0.1, 1.0]`), `maxWidth` (padrão `1600`), `deviceId` (opcional; um identificador desconhecido falha com `INVALID_REQUEST`).
  - Conteúdo da resposta: `format: "jpg"`, `base64`, `width`, `height`.
  - Proteção do conteúdo: recomprimido para manter o base64 abaixo de 5 MB (o mesmo limite do iOS).

- `camera.clip`
  - Parâmetros: `facing` (padrão `front`), `durationMs` (padrão `3000`, limitado ao intervalo `[200, 60000]`), `includeAudio` (padrão `true`), `deviceId` (opcional).
  - Conteúdo da resposta: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Proteção do conteúdo: o MP4 bruto é limitado a 18 MB antes da codificação em base64; clipes que excedem o limite falham com `PAYLOAD_TOO_LARGE` (reduza `durationMs` e tente novamente).

## Aplicativo macOS

### Configuração do usuário no macOS

O aplicativo complementar do macOS disponibiliza uma caixa de seleção:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - Padrão: **desativado**.
  - Quando desativado: as solicitações de câmera retornam `CAMERA_DISABLED: enable Camera in Settings`.

### Auxiliar da CLI (invocação do Node)

Use a CLI principal `openclaw` para invocar comandos da câmera no Node macOS.

```bash
openclaw nodes camera list --node <id>                     # lista os identificadores das câmeras
openclaw nodes camera snap --node <id>                     # exibe o caminho salvo
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # exibe o caminho salvo
openclaw nodes camera clip --node <id> --duration-ms 3000   # exibe o caminho salvo (opção legada)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- `openclaw nodes camera snap` usa `maxWidth=1600` por padrão, a menos que o valor seja substituído.
- `camera.snap` aguarda `delayMs` (padrão de 2000 ms, limitado ao intervalo `[0, 10000]`) após o aquecimento e a estabilização da exposição antes da captura.
- Os conteúdos das fotos são recomprimidos para manter o base64 abaixo de 5 MB.

## Segurança e limites práticos

- O acesso à câmera e ao microfone aciona as solicitações de permissão habituais do sistema operacional (e exige strings de uso em `Info.plist`).
- Os clipes de vídeo são limitados a 60 segundos para evitar conteúdos do Node grandes demais (sobrecarga do base64 somada aos limites das mensagens).

## Vídeo da tela no macOS (nível do sistema operacional)

Para vídeo da _tela_ (não da câmera), use o aplicativo complementar do macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # exibe o caminho salvo
```

Exige a permissão **Screen Recording** do macOS (TCC).

## Conteúdo relacionado

- [Suporte a imagens e mídia](/pt-BR/nodes/images)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Comando de localização](/pt-BR/nodes/location-command)
