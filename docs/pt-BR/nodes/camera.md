---
read_when:
    - Adição ou modificação da captura da câmera em plataformas Node
    - Ampliação dos fluxos de trabalho de arquivos temporários de MEDIA acessíveis por agentes
summary: Captura da câmera em nodes iOS, Android, macOS e Linux para fotos e clipes de vídeo curtos
title: Captura da câmera
x-i18n:
    generated_at: "2026-07-16T12:38:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8fff8302863b63209222d87b350238dd2f01e18d06ce1783036b3cefaca14020
    source_path: nodes/camera.md
    workflow: 16
---

O OpenClaw oferece suporte à captura pela câmera para fluxos de trabalho de agentes em Nodes **iOS**, **Android**, **macOS** e **Linux** pareados: capture uma foto (`jpg`) ou um clipe de vídeo curto (`mp4`, com áudio opcional) via `node.invoke` do Gateway.

Todo acesso à câmera é controlado por uma configuração definida pelo usuário em cada plataforma.

## Node iOS

### Configuração do usuário no iOS

- Aba Configurações do iOS → **Câmera** → **Permitir câmera** (`camera.enabled`).
  - Padrão: **ativado** (uma chave ausente é considerada habilitada).
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
    - `deviceId`: string (opcional; de `camera.list`)
  - Payload da resposta: `format: "jpg"`, `base64`, `width`, `height`.
  - Proteção do payload: as fotos são recomprimidas para manter o payload codificado em base64 abaixo de 5MB.

- `camera.clip`
  - Parâmetros:
    - `facing`: `front|back` (padrão: `front`)
    - `durationMs`: número (padrão `3000`, limitado a `[250, 60000]`)
    - `includeAudio`: booleano (padrão `true`)
    - `format`: atualmente `mp4`
    - `deviceId`: string (opcional; de `camera.list`)
  - Payload da resposta: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### Requisito de primeiro plano no iOS

Assim como `canvas.*`, o Node iOS permite comandos `camera.*` somente em **primeiro plano**. As invocações em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE`.

### Auxiliar da CLI

A maneira mais fácil de obter arquivos de mídia é usar o auxiliar da CLI, que grava a mídia decodificada em um arquivo temporário e exibe o caminho salvo.

```bash
openclaw nodes camera snap --node <id>                 # padrão: câmeras frontal + traseira (2 linhas MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` usa `--facing both` por padrão, capturando pelas câmeras frontal e traseira para fornecer ao agente as duas perspectivas; informe `--device-id` com uma única orientação explícita (`both` é rejeitado quando `--device-id` está definido). Os arquivos de saída são temporários (no diretório temporário do sistema operacional), a menos que seja criado um wrapper próprio.

## Node Android

### Configuração do usuário no Android

- Painel Configurações do Android → **Câmera** → **Permitir câmera** (`camera.enabled`).
  - **Em instalações novas, o padrão é desativado.** As instalações existentes anteriores a essa configuração são migradas para **ativado**, para que as atualizações não removam silenciosamente um acesso à câmera que funcionava antes.
  - Quando desativado: os comandos `camera.*` retornam `CAMERA_DISABLED: enable Camera in Settings`.

### Permissões

- `CAMERA` é obrigatório para `camera.snap` e `camera.clip`; uma permissão ausente ou negada retorna `CAMERA_PERMISSION_REQUIRED`.
- `RECORD_AUDIO` é obrigatório para `camera.clip` quando `includeAudio` é `true`; uma permissão ausente ou negada retorna `MIC_PERMISSION_REQUIRED`.

O aplicativo solicita permissões durante a execução quando possível.

### Requisito de primeiro plano no Android

Assim como `canvas.*`, o Node Android permite comandos `camera.*` somente em **primeiro plano**. As invocações em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Comandos do Android (via `node.invoke` do Gateway)

- `camera.list`
  - Payload da resposta: `devices` — matriz de `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parâmetros: `facing` (`front|back`, padrão `front`), `quality` (padrão `0.95`, limitado a `[0.1, 1.0]`), `maxWidth` (padrão `1600`), `deviceId` (opcional; um ID desconhecido falha com `INVALID_REQUEST`).
  - Payload da resposta: `format: "jpg"`, `base64`, `width`, `height`.
  - Proteção do payload: recomprimido para manter o base64 abaixo de 5MB (o mesmo limite do iOS).

- `camera.clip`
  - Parâmetros: `facing` (padrão `front`), `durationMs` (padrão `3000`, limitado a `[200, 60000]`), `includeAudio` (padrão `true`), `deviceId` (opcional).
  - Payload da resposta: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Proteção do payload: o MP4 bruto é limitado a 18MB antes da codificação em base64; clipes acima do limite falham com `PAYLOAD_TOO_LARGE` (reduza `durationMs` e tente novamente).

## Aplicativo para macOS

### Configuração do usuário no macOS

O aplicativo complementar para macOS disponibiliza uma caixa de seleção:

- **Configurações → Geral → Permitir câmera** (`openclaw.cameraEnabled`).
  - Padrão: **desativado**.
  - Quando desativado: as solicitações da câmera retornam `CAMERA_DISABLED: enable Camera in Settings`.

### Auxiliar da CLI (invocação do Node)

Use a CLI principal `openclaw` para invocar comandos da câmera no Node macOS.

```bash
openclaw nodes camera list --node <id>                     # lista os IDs das câmeras
openclaw nodes camera snap --node <id>                     # exibe o caminho salvo
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # exibe o caminho salvo
openclaw nodes camera clip --node <id> --duration-ms 3000   # exibe o caminho salvo (flag legada)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- `openclaw nodes camera snap` usa `maxWidth=1600` por padrão, a menos que seja substituído.
- `camera.snap` aguarda `delayMs` (padrão 2000ms, limitado a `[0, 10000]`) após a estabilização do aquecimento e da exposição antes da captura.
- Os payloads de fotos são recomprimidos para manter o base64 abaixo de 5MB.

## Host do Node Linux

O Plugin Linux Node incluído adiciona captura pela câmera ao serviço `openclaw node` da CLI. Ele funciona em um host sem interface gráfica e não exige o aplicativo para desktop Linux.

O acesso à câmera é desativado por padrão. Habilite-o na entrada do Plugin e reinicie o serviço do Node para que seu anúncio do Gateway seja recriado:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          camera: { enabled: true },
        },
      },
    },
  },
}
```

Requisitos:

- FFmpeg com entrada V4L2, `libx264` e suporte a AAC
- um dispositivo `/dev/video*` legível pelo usuário do serviço do Node; em distribuições comuns, adicione esse usuário ao grupo `video`
- para clipes com o `includeAudio: true` padrão, um servidor PulseAudio funcional ou uma camada de compatibilidade PipeWire PulseAudio com uma fonte padrão

O Linux retorna caminhos de dispositivos V4L2 legíveis e capazes de realizar capturas por meio de `camera.list`; o FFmpeg verifica cada candidato `/dev/video*` e omite metadados ou Nodes somente de saída. O `position` do dispositivo é `unknown`, portanto, solicitações de orientação sem `deviceId` produzem uma foto ou um clipe com posição `unknown`, em vez de afirmar que a câmera é frontal ou traseira. Use `deviceId` quando um host tiver várias câmeras. `camera.snap` usa o aquecimento da entrada do FFmpeg por `delayMs` e preserva a proporção da imagem ao limitar a largura. `camera.clip` grava o áudio do microfone como a faixa de áudio do MP4; o OpenClaw deliberadamente não disponibiliza um comando independente para o microfone.

O Plugin usa `libx264` para vídeo MP4 e não altera codecs silenciosamente. Uma compilação do FFmpeg sem a entrada ou os codificadores obrigatórios retorna `CAMERA_UNAVAILABLE`. Fotos e clipes que excederiam o limite de 25MB do payload em base64 falham com `PAYLOAD_TOO_LARGE`.

`camera.snap` e `camera.clip` continuam sendo comandos perigosos. Adicione-os a `gateway.nodes.allowCommands` somente quando houver a intenção de armar a captura; habilitar apenas o Plugin não ignora a política do Gateway.

## Segurança e limites práticos

- O acesso à câmera e ao microfone aciona as solicitações de permissão habituais do sistema operacional (e exige strings de uso em `Info.plist`).
- Os clipes de vídeo são limitados a 60s para evitar payloads do Node grandes demais (sobrecarga do base64 somada aos limites das mensagens).

## Vídeo da tela no macOS (nível do sistema operacional)

Para gravar um vídeo da _tela_ (não da câmera), use o aplicativo complementar para macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # exibe o caminho salvo
```

Exige a permissão **Screen Recording** do macOS (TCC).

## Conteúdo relacionado

- [Suporte a imagens e mídia](/pt-BR/nodes/images)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Comando de localização](/pt-BR/nodes/location-command)
