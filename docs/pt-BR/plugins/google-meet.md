---
read_when:
    - Você quer que um agente OpenClaw entre em uma chamada do Google Meet
    - Você está configurando Chrome, Chrome node ou Twilio como transporte do Google Meet
summary: 'Plugin do Google Meet: entrar em URLs explícitas do Meet via Chrome ou Twilio com padrões de voz em tempo real'
title: Plugin do Google Meet
x-i18n:
    generated_at: "2026-04-24T06:02:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab439b777e3043cc647a29e8e17b2794d14f48deceaadf8f81a014dd44583e23
    source_path: plugins/google-meet.md
    workflow: 15
---

# Plugin do Google Meet

Suporte a participante do Google Meet para o OpenClaw.

O plugin é explícito por design:

- Ele entra apenas em uma URL explícita `https://meet.google.com/...`.
- Voz em `realtime` é o modo padrão.
- A voz em tempo real pode chamar de volta o agente completo do OpenClaw quando
  forem necessários reasoning mais profundo ou tools.
- A autenticação começa como OAuth pessoal do Google ou um perfil do Chrome já autenticado.
- Não há anúncio automático de consentimento.
- O backend de áudio padrão do Chrome é `BlackHole 2ch`.
- O Chrome pode ser executado localmente ou em um host de Node pareado.
- O Twilio aceita um número dial-in mais um PIN opcional ou sequência DTMF.
- O comando da CLI é `googlemeet`; `meet` é reservado para workflows mais amplos
  de teleconferência do agente.

## Início rápido

Instale as dependências locais de áudio e garanta que o provider realtime possa usar
a OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

`blackhole-2ch` instala o dispositivo virtual de áudio `BlackHole 2ch`. O
instalador do Homebrew exige uma reinicialização antes que o macOS exponha o dispositivo:

```bash
sudo reboot
```

Após reiniciar, verifique as duas partes:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Habilite o plugin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Verifique a configuração:

```bash
openclaw googlemeet setup
```

Entre em uma reunião:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Ou deixe um agente entrar por meio da tool `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

O Chrome entra como o perfil autenticado do Chrome. No Meet, escolha `BlackHole 2ch` para
o caminho de microfone/alto-falante usado pelo OpenClaw. Para áudio duplex limpo, use
dispositivos virtuais separados ou um grafo no estilo Loopback; um único dispositivo BlackHole já é
suficiente para um primeiro smoke test, mas pode gerar eco.

### Gateway local + Chrome no Parallels

Você **não** precisa de um Gateway OpenClaw completo nem de chave de API de modelo dentro de uma VM macOS
apenas para fazer a VM ser dona do Chrome. Execute o Gateway e o agente localmente, depois execute um
host de Node na VM. Habilite uma vez o plugin integrado na VM para que o node
anuncie o comando do Chrome:

O que roda onde:

- Host do Gateway: OpenClaw Gateway, workspace do agente, chaves de modelo/API, provider
  realtime e configuração do plugin Google Meet.
- VM macOS do Parallels: CLI/host de Node do OpenClaw, Google Chrome, SoX, BlackHole 2ch
  e um perfil do Chrome autenticado no Google.
- Não é necessário na VM: serviço do Gateway, config do agente, chave OpenAI/GPT ou configuração
  de provider de modelo.

Instale as dependências da VM:

```bash
brew install blackhole-2ch sox
```

Reinicie a VM após instalar BlackHole para que o macOS exponha `BlackHole 2ch`:

```bash
sudo reboot
```

Após reiniciar, verifique se a VM consegue ver o dispositivo de áudio e os comandos SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Instale ou atualize o OpenClaw na VM e então habilite nela o plugin integrado:

```bash
openclaw plugins enable google-meet
```

Inicie o host de Node na VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Se `<gateway-host>` for um IP de LAN e você não estiver usando TLS, o node recusará o
WebSocket em texto simples, a menos que você faça opt-in para essa rede privada confiável:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Use a mesma variável de ambiente ao instalar o node como LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

Aprove o node a partir do host do Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirme que o Gateway vê o node e que ele anuncia `googlemeet.chrome`:

```bash
openclaw nodes status
```

Roteie o Meet por esse node no host do Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Agora entre normalmente a partir do host do Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

ou peça ao agente para usar a tool `google_meet` com `transport: "chrome-node"`.

Se `chromeNode.node` for omitido, o OpenClaw faz seleção automática apenas quando exatamente um
node conectado anuncia `googlemeet.chrome`. Se vários nodes capazes estiverem
conectados, defina `chromeNode.node` como o id do node, nome de exibição ou IP remoto.

Verificações comuns de falha:

- `No connected Google Meet-capable node`: inicie `openclaw node run` na VM,
  aprove o pareamento e garanta que `openclaw plugins enable google-meet` foi executado
  na VM. Confirme também que o host do Gateway permite o comando do node com
  `gateway.nodes.allowCommands: ["googlemeet.chrome"]`.
- `BlackHole 2ch audio device not found on the node`: instale `blackhole-2ch`
  na VM e reinicie a VM.
- O Chrome abre mas não consegue entrar: autentique-se no Chrome dentro da VM e confirme que
  esse perfil consegue entrar manualmente na URL do Meet.
- Sem áudio: no Meet, roteie microfone/alto-falante pelo caminho do dispositivo virtual de áudio
  usado pelo OpenClaw; use dispositivos virtuais separados ou roteamento estilo Loopback
  para áudio duplex limpo.

## Observações sobre instalação

O padrão realtime do Chrome usa duas tools externas:

- `sox`: utilitário de áudio em linha de comando. O plugin usa seus comandos `rec` e `play`
  para a bridge de áudio padrão em 8 kHz G.711 mu-law.
- `blackhole-2ch`: driver virtual de áudio do macOS. Ele cria o dispositivo de áudio `BlackHole 2ch`
  pelo qual Chrome/Meet podem ser roteados.

O OpenClaw não inclui nem redistribui nenhum dos dois pacotes. A documentação orienta os usuários a
instalá-los como dependências do host por meio do Homebrew. O SoX é licenciado como
`LGPL-2.0-only AND GPL-2.0-only`; o BlackHole é GPL-3.0. Se você criar um
instalador ou appliance que inclua BlackHole junto com o OpenClaw, revise os
termos de licenciamento upstream do BlackHole ou obtenha uma licença separada da Existential Audio.

## Transportes

### Chrome

O transporte Chrome abre a URL do Meet no Google Chrome e entra como o perfil autenticado
do Chrome. No macOS, o plugin verifica `BlackHole 2ch` antes do início.
Se configurado, ele também executa um comando de health da bridge de áudio e um comando de inicialização
antes de abrir o Chrome. Use `chrome` quando Chrome/áudio estiverem no host do Gateway;
use `chrome-node` quando Chrome/áudio estiverem em um node pareado, como uma VM macOS do Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Roteie o áudio de microfone e alto-falante do Chrome pela bridge de áudio local do OpenClaw.
Se `BlackHole 2ch` não estiver instalado, a entrada falha com um erro de configuração
em vez de entrar silenciosamente sem um caminho de áudio.

### Twilio

O transporte Twilio é um plano de discagem estrito delegado ao plugin Voice Call. Ele
não analisa páginas do Meet em busca de números de telefone.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Use `--dtmf-sequence` quando a reunião precisar de uma sequência personalizada:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth e preflight

O acesso à API de mídia do Google Meet usa primeiro um cliente OAuth pessoal. Configure
`oauth.clientId` e opcionalmente `oauth.clientSecret`, depois execute:

```bash
openclaw googlemeet auth login --json
```

O comando imprime um bloco de configuração `oauth` com um refresh token. Ele usa PKCE,
callback localhost em `http://localhost:8085/oauth2callback` e um fluxo manual
de copiar/colar com `--manual`.

Estas variáveis de ambiente são aceitas como fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` ou `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ou `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ou
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` ou `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` ou `GOOGLE_MEET_PREVIEW_ACK`

Resolva uma URL, código ou `spaces/{id}` do Meet por meio de `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Execute o preflight antes do trabalho de mídia:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Defina `preview.enrollmentAcknowledged: true` apenas depois de confirmar que seu
projeto Cloud, principal OAuth e participantes da reunião estão inscritos no
Google Workspace Developer Preview Program para APIs de mídia do Meet.

## Configuração

O caminho comum realtime do Chrome precisa apenas do plugin habilitado, BlackHole, SoX
e uma chave OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

Defina a configuração do plugin em `plugins.entries.google-meet.config`:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Padrões:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: id/nome/IP opcional do node para `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: comando SoX `rec` gravando áudio
  8 kHz G.711 mu-law em stdout
- `chrome.audioOutputCommand`: comando SoX `play` lendo áudio
  8 kHz G.711 mu-law de stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: respostas faladas curtas, com
  `openclaw_agent_consult` para respostas mais profundas

Substituições opcionais:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    toolPolicy: "owner",
  },
}
```

Configuração apenas para Twilio:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

## Tool

Agentes podem usar a tool `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Use `transport: "chrome"` quando o Chrome estiver no host do Gateway. Use
`transport: "chrome-node"` quando o Chrome estiver em um node pareado, como uma VM
Parallels. Em ambos os casos, o modelo realtime e `openclaw_agent_consult` rodam no
host do Gateway, então as credenciais do modelo permanecem lá.

Use `action: "status"` para listar sessões ativas ou inspecionar um ID de sessão. Use
`action: "leave"` para marcar uma sessão como encerrada.

## Consulta do agente em realtime

O modo realtime do Chrome é otimizado para um loop de voz ao vivo. O provider de voz
realtime ouve o áudio da reunião e fala pela bridge de áudio configurada.
Quando o modelo realtime precisa de reasoning mais profundo, informação atual ou tools normais
do OpenClaw, ele pode chamar `openclaw_agent_consult`.

A tool de consulta executa o agente regular do OpenClaw nos bastidores com contexto recente da transcrição
da reunião e retorna uma resposta falada concisa para a sessão de voz realtime. O modelo de voz pode então
falar essa resposta de volta para a reunião.

`realtime.toolPolicy` controla a execução da consulta:

- `safe-read-only`: expõe a tool de consulta e limita o agente regular a
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e
  `memory_get`.
- `owner`: expõe a tool de consulta e permite que o agente regular use a política normal de tools do
  agente.
- `none`: não expõe a tool de consulta ao modelo de voz realtime.

A chave de sessão de consulta tem escopo por sessão do Meet, então chamadas de consulta subsequentes
podem reutilizar o contexto anterior de consulta durante a mesma reunião.

## Observações

A API oficial de mídia do Google Meet é orientada a recebimento, então falar em uma chamada
do Meet ainda exige um caminho de participante. Este plugin mantém esse limite visível:
o Chrome cuida da participação no browser e do roteamento local de áudio; o Twilio cuida da participação por discagem telefônica.

O modo realtime do Chrome precisa de um dos itens abaixo:

- `chrome.audioInputCommand` mais `chrome.audioOutputCommand`: o OpenClaw é dono da
  bridge do modelo realtime e encanará áudio 8 kHz G.711 mu-law entre esses
  comandos e o provider de voz realtime selecionado.
- `chrome.audioBridgeCommand`: um comando de bridge externo é dono de todo o caminho local
  de áudio e deve sair após iniciar ou validar seu daemon.

Para áudio duplex limpo, roteie a saída do Meet e o microfone do Meet por dispositivos
virtuais separados ou por um grafo de dispositivo virtual no estilo Loopback. Um único dispositivo
BlackHole compartilhado pode ecoar outros participantes de volta para a chamada.

`googlemeet leave` interrompe a bridge de áudio realtime em par de comandos para sessões
Chrome. Para sessões Twilio delegadas por meio do plugin Voice Call, ele também
desliga a chamada de voz subjacente.

## Relacionado

- [Plugin Voice Call](/pt-BR/plugins/voice-call)
- [Modo Talk](/pt-BR/nodes/talk)
- [Criando plugins](/pt-BR/plugins/building-plugins)
