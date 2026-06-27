---
read_when:
    - Você quer que um agente OpenClaw participe de uma chamada do Google Meet
    - Você quer que um agente OpenClaw crie uma nova chamada do Google Meet
    - Você está configurando o Chrome, o nó Chrome ou o Twilio como um transporte do Google Meet
summary: 'Plugin do Google Meet: entre em URLs explícitas do Meet pelo Chrome ou Twilio com padrões de resposta falada do agente'
title: Plugin do Google Meet
x-i18n:
    generated_at: "2026-06-27T17:47:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e85d531897e3aeadf0ac718f82a7aac5ce73715e182e96ceba77cb76eff094c4
    source_path: plugins/google-meet.md
    workflow: 16
---

Suporte a participantes do Google Meet para OpenClaw — o plugin é explícito por design:

- Ele só entra em uma URL explícita `https://meet.google.com/...`.
- Ele pode criar um novo espaço do Meet pela API do Google Meet e então entrar na
  URL retornada.
- `agent` é o modo padrão de resposta por voz: a transcrição em tempo real escuta, o
  agente OpenClaw configurado responde, e o TTS regular do OpenClaw fala no Meet.
- `bidi` continua disponível como modo de fallback direto de modelo de voz em tempo real.
- Os agentes escolhem o comportamento de entrada com `mode`: use `agent` para
  escutar/responder ao vivo, `bidi` para fallback direto de voz em tempo real, ou `transcribe`
  para entrar/controlar o navegador sem a ponte de resposta por voz.
- A autenticação começa como OAuth pessoal do Google ou um perfil do Chrome já conectado.
- Não há anúncio automático de consentimento.
- O backend de áudio padrão do Chrome é `BlackHole 2ch`.
- O Chrome pode rodar localmente ou em um host de nó pareado.
- O Twilio aceita um número de discagem mais um PIN ou sequência DTMF opcional; ele
  não consegue discar uma URL do Meet diretamente.
- O comando da CLI é `googlemeet`; `meet` é reservado para fluxos mais amplos de
  teleconferência de agentes.

## Início rápido

Instale as dependências locais de áudio e configure um provedor de transcrição em tempo real
mais o TTS regular do OpenClaw. A OpenAI é o provedor de transcrição padrão;
o Google Gemini Live também funciona como um fallback de voz `bidi` separado com
`realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` instala o dispositivo de áudio virtual `BlackHole 2ch`. O instalador do
Homebrew exige uma reinicialização antes que o macOS exponha o dispositivo:

```bash
sudo reboot
```

Após reiniciar, verifique as duas partes:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
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

A saída de configuração foi feita para ser legível por agentes e sensível ao modo. Ela relata o perfil do Chrome,
a fixação de nó e, para entradas em tempo real pelo Chrome, a ponte de áudio
BlackHole/SoX e as verificações de introdução em tempo real atrasada. Para entradas apenas de observação, verifique o mesmo
transporte com `--mode transcribe`; esse modo ignora os pré-requisitos de áudio em tempo real
porque não escuta nem fala pela ponte:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Quando a delegação do Twilio está configurada, a configuração também relata se o
plugin `voice-call`, as credenciais do Twilio e a exposição pública de Webhook estão prontos.
Trate qualquer verificação `ok: false` como um bloqueador para o transporte e o modo
verificados antes de pedir que um agente entre. Use `openclaw googlemeet setup --json` para
scripts ou saída legível por máquina. Use `--transport chrome`,
`--transport chrome-node` ou `--transport twilio` para pré-validar um transporte específico
antes que um agente tente usá-lo.

Para Twilio, sempre pré-valide o transporte explicitamente quando o transporte padrão
for Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Isso detecta fiação ausente do `voice-call`, credenciais do Twilio ou exposição de
Webhook inalcançável antes que o agente tente discar para a reunião.

Entre em uma reunião:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Ou deixe um agente entrar pela ferramenta `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

A ferramenta `google_meet` voltada a agentes continua disponível em hosts que não sejam macOS para
fluxos de artefatos, calendário, configuração, transcrição, Twilio e `chrome-node`. Ações locais
de resposta por voz do Chrome são bloqueadas nesses hosts porque o caminho de áudio do Chrome incluído
atualmente depende do `BlackHole 2ch` do macOS. No Linux, use `mode: "transcribe"`,
discagem do Twilio ou um host macOS `chrome-node` para participação com resposta por voz
pelo Chrome.

Crie uma nova reunião e entre nela:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Para salas criadas pela API, use `SpaceConfig.accessType` do Google Meet quando quiser
que a política sem solicitação de entrada da sala seja explícita em vez de herdada dos padrões da conta
Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` permite que qualquer pessoa com a URL do Meet entre sem pedir permissão. `TRUSTED` permite que
usuários confiáveis da organização do host, usuários externos convidados e usuários por discagem
entrem sem pedir permissão. `RESTRICTED` limita a entrada sem solicitação aos convidados. Essas
configurações só se aplicam ao caminho oficial de criação pela API do Google Meet, então as credenciais
OAuth devem estar configuradas.

Se você autenticou o Google Meet antes de esta opção estar disponível, execute novamente
`openclaw googlemeet auth login --json` depois de adicionar o escopo
`meetings.space.settings` à sua tela de consentimento OAuth do Google.

Crie apenas a URL sem entrar:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` tem dois caminhos:

- Criação por API: usada quando as credenciais OAuth do Google Meet estão configuradas. Este é
  o caminho mais determinístico e não depende do estado da interface do navegador.
- Fallback pelo navegador: usado quando as credenciais OAuth estão ausentes. O OpenClaw usa o
  nó Chrome fixado, abre `https://meet.google.com/new`, espera o Google
  redirecionar para uma URL real com código de reunião e então retorna essa URL. Esse caminho exige
  que o perfil Chrome do OpenClaw no nó já esteja conectado ao Google.
  A automação do navegador lida com o prompt inicial de microfone do próprio Meet; esse prompt
  não é tratado como uma falha de login do Google.
  Os fluxos de entrada e criação também tentam reutilizar uma aba existente do Meet antes de abrir uma
  nova. A correspondência ignora strings de consulta inofensivas na URL, como `authuser`, então uma
  nova tentativa do agente deve focar a reunião já aberta em vez de criar uma segunda
  aba do Chrome.

A saída do comando/ferramenta inclui um campo `source` (`api` ou `browser`) para que agentes
possam explicar qual caminho foi usado. `create` entra na nova reunião por padrão e
retorna `joined: true` mais a sessão de entrada. Para apenas gerar a URL, use
`create --no-join` na CLI ou passe `"join": false` para a ferramenta.

Ou diga a um agente: "Crie um Google Meet, entre nele com o modo de resposta por voz do agente
e me envie o link." O agente deve chamar `google_meet` com
`action: "create"` e então compartilhar o `meetingUri` retornado.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Para uma entrada apenas de observação/controle do navegador, defina `"mode": "transcribe"`. Isso não
inicia a ponte duplex de voz em tempo real, não exige BlackHole nem SoX,
e não responderá por voz na reunião. Entradas pelo Chrome nesse modo também evitam
a concessão de permissão de microfone/câmera do OpenClaw e evitam o caminho **Usar
microfone** do Meet. Se o Meet mostrar um intersticial de escolha de áudio, a automação tenta
o caminho sem microfone e, caso contrário, relata uma ação manual em vez de abrir
o microfone local. No modo de transcrição, transportes Chrome gerenciados também instalam
um observador de legendas do Meet em melhor esforço. `googlemeet status --json` e
`googlemeet doctor` exibem `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
e uma cauda curta `recentTranscript` para que operadores possam saber se o navegador
entrou na chamada e se as legendas do Meet estão produzindo texto.
Use `openclaw googlemeet test-listen <meet-url> --transport chrome-node` quando
precisar de uma verificação sim/não: ele entra em modo de transcrição, espera por movimento novo
de legenda ou transcrição e retorna `listenVerified`, `listenTimedOut`, campos de
ação manual e a saúde mais recente das legendas.

Durante sessões em tempo real, o status de `google_meet` inclui a saúde do navegador e da ponte de áudio,
como `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, últimos timestamps de entrada/saída,
contadores de bytes e estado fechado da ponte. Se um prompt seguro da página do Meet
aparecer, a automação do navegador lida com ele quando consegue. Login, admissão pelo host e
prompts de permissão do navegador/SO são relatados como ação manual com motivo e
mensagem para o agente retransmitir. Sessões Chrome gerenciadas só emitem a introdução ou
frase de teste depois que a saúde do navegador relata `inCall: true`; caso contrário, o status relata
`speechReady: false` e a tentativa de fala é bloqueada em vez de fingir que o
agente falou na reunião.

Entradas locais pelo Chrome usam o perfil de navegador conectado do OpenClaw. O modo em tempo real
exige `BlackHole 2ch` para o caminho de microfone/alto-falante usado pelo OpenClaw. Para
áudio duplex limpo, use dispositivos virtuais separados ou um grafo no estilo Loopback; um
único dispositivo BlackHole é suficiente para um primeiro teste de fumaça, mas pode gerar eco.

### Gateway local + Chrome no Parallels

Você **não** precisa de um Gateway OpenClaw completo nem de uma chave de API de modelo dentro de uma VM macOS
apenas para fazer a VM controlar o Chrome. Rode o Gateway e o agente localmente, depois rode um
host de nó na VM. Habilite o plugin incluído na VM uma vez para que o nó
anuncie o comando do Chrome:

O que roda onde:

- Host do Gateway: Gateway OpenClaw, workspace do agente, chaves de modelo/API, provedor em tempo real
  e a configuração do plugin Google Meet.
- VM macOS Parallels: CLI/host de nó do OpenClaw, Google Chrome, SoX, BlackHole 2ch
  e um perfil do Chrome conectado ao Google.
- Não necessário na VM: serviço Gateway, configuração do agente, chave OpenAI/GPT ou configuração
  de provedor de modelo.

Instale as dependências da VM:

```bash
brew install blackhole-2ch sox
```

Reinicie a VM após instalar o BlackHole para que o macOS exponha `BlackHole 2ch`:

```bash
sudo reboot
```

Após reiniciar, verifique se a VM consegue ver o dispositivo de áudio e os comandos do SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Instale ou atualize o OpenClaw na VM e então habilite o plugin incluído lá:

```bash
openclaw plugins enable google-meet
```

Inicie o host de nó na VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Se `<gateway-host>` for um IP de LAN e você não estiver usando TLS, o nó recusará o
WebSocket em texto claro a menos que você aceite isso explicitamente para essa rede privada confiável:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Use a mesma variável de ambiente ao instalar o nó como LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` é ambiente de processo, não uma configuração
de `openclaw.json`. `openclaw node install` a armazena no ambiente do LaunchAgent
quando ela está presente no comando de instalação.

Aprove o nó a partir do host do Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirme que o Gateway vê o nó e que ele anuncia tanto `googlemeet.chrome`
quanto a capacidade de navegador/`browser.proxy`:

```bash
openclaw nodes status
```

Roteie o Meet por esse nó no host do Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
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

ou peça ao agente para usar a ferramenta `google_meet` com `transport: "chrome-node"`.

Para um teste de fumaça de um comando que cria ou reutiliza uma sessão, fala uma frase conhecida
e imprime a saúde da sessão:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante a entrada em tempo real, a automação de navegador do OpenClaw preenche o nome do convidado, clica em
Entrar/Pedir para entrar e aceita a opção "Usar microfone" da primeira execução do Meet quando esse
prompt aparece. Durante a entrada somente para observação ou a criação de reunião somente pelo navegador, ela
continua após o mesmo prompt sem microfone quando essa opção está disponível.
Se o perfil do navegador não estiver conectado, o Meet estiver aguardando admissão pelo organizador,
o Chrome precisar de permissão de microfone/câmera para uma entrada em tempo real, ou o Meet estiver travado
em um prompt que a automação não conseguiu resolver, o resultado de entrada/teste de fala relata
`manualActionRequired: true` com `manualActionReason` e
`manualActionMessage`. Os agentes devem parar de tentar novamente a entrada, relatar essa mensagem exata
mais o `browserUrl`/`browserTitle` atual, e tentar novamente somente depois que a
ação manual no navegador estiver concluída.

Se `chromeNode.node` for omitido, o OpenClaw seleciona automaticamente somente quando exatamente um
nó conectado anuncia tanto `googlemeet.chrome` quanto controle de navegador. Se
vários nós compatíveis estiverem conectados, defina `chromeNode.node` como o id do nó,
nome de exibição ou IP remoto.

Verificações comuns de falha:

- `Configured Google Meet node ... is not usable: offline`: o nó fixado é
  conhecido pelo Gateway, mas está indisponível. Os agentes devem tratar esse nó como
  estado de diagnóstico, não como um host Chrome utilizável, e relatar o bloqueador de configuração
  em vez de recorrer a outro transporte, a menos que o usuário tenha pedido isso.
- `No connected Google Meet-capable node`: inicie `openclaw node run` na VM,
  aprove o pareamento e certifique-se de que `openclaw plugins enable google-meet` e
  `openclaw plugins enable browser` foram executados na VM. Confirme também que o
  host do Gateway permite ambos os comandos de nó com
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: instale `blackhole-2ch` no host
  que está sendo verificado e reinicie antes de usar áudio local do Chrome.
- `BlackHole 2ch audio device not found on the node`: instale `blackhole-2ch`
  na VM e reinicie a VM.
- O Chrome abre, mas não consegue entrar: faça login no perfil do navegador dentro da VM, ou
  mantenha `chrome.guestName` definido para entrada como convidado. A entrada automática como convidado usa a
  automação de navegador do OpenClaw por meio do proxy de navegador do nó; certifique-se de que a configuração do navegador do nó
  aponta para o perfil desejado, por exemplo
  `browser.defaultProfile: "user"` ou um perfil nomeado de sessão existente.
- Abas duplicadas do Meet: deixe `chrome.reuseExistingTab: true` ativado. O OpenClaw
  ativa uma aba existente para a mesma URL do Meet antes de abrir uma nova, e
  a criação de reunião pelo navegador reutiliza uma aba em andamento de `https://meet.google.com/new`
  ou de prompt de conta Google antes de abrir outra.
- Sem áudio: no Meet, roteie o áudio de microfone/alto-falante pelo caminho de dispositivo de áudio virtual
  usado pelo OpenClaw; use dispositivos virtuais separados ou roteamento no estilo Loopback
  para áudio duplex limpo.

## Notas de instalação

O padrão de retorno de fala do Chrome usa duas ferramentas externas:

- `sox`: utilitário de áudio de linha de comando. O plugin usa comandos explícitos de dispositivo CoreAudio
  para a ponte de áudio PCM16 de 24 kHz padrão.
- `blackhole-2ch`: driver de áudio virtual do macOS. Ele cria o dispositivo de áudio `BlackHole 2ch`
  pelo qual Chrome/Meet podem rotear.

O OpenClaw não inclui nem redistribui nenhum dos pacotes. A documentação pede que os usuários
os instalem como dependências de host pelo Homebrew. O SoX é licenciado como
`LGPL-2.0-only AND GPL-2.0-only`; o BlackHole é GPL-3.0. Se você criar um
instalador ou appliance que inclua o BlackHole com o OpenClaw, revise os
termos de licenciamento upstream do BlackHole ou obtenha uma licença separada da Existential Audio.

## Transportes

### Chrome

O transporte Chrome abre a URL do Meet pelo controle de navegador do OpenClaw e entra
como o perfil de navegador do OpenClaw conectado. No macOS, o plugin verifica
`BlackHole 2ch` antes da inicialização. Se configurado, ele também executa um comando de integridade da ponte de áudio
e um comando de inicialização antes de abrir o Chrome. Use `chrome` quando
Chrome/áudio estiverem no host do Gateway; use `chrome-node` quando Chrome/áudio estiverem
em um nó pareado, como uma VM macOS do Parallels. Para Chrome local, escolha o
perfil com `browser.defaultProfile`; `chrome.browserProfile` é passado para
hosts `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Roteie o áudio de microfone e alto-falante do Chrome pela ponte de áudio local do OpenClaw.
Se `BlackHole 2ch` não estiver instalado, a entrada falha com um erro de configuração
em vez de entrar silenciosamente sem um caminho de áudio.

### Twilio

O transporte Twilio é um plano de discagem estrito delegado ao plugin Voice Call. Ele
não analisa páginas do Meet em busca de números de telefone.

Use isso quando a participação pelo Chrome não estiver disponível ou quando você quiser um fallback de discagem por telefone.
O Google Meet deve expor um número de discagem por telefone e PIN para a
reunião; o OpenClaw não descobre esses dados pela página do Meet.

Ative o plugin Voice Call no host do Gateway, não no nó Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
      },
    },
  },
}
```

Forneça credenciais da Twilio por ambiente ou configuração. O ambiente mantém
segredos fora de `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Use `realtime.provider: "openai"` com o plugin provedor OpenAI e
`OPENAI_API_KEY` em vez disso, se esse for seu provedor de voz em tempo real.

Reinicie ou recarregue o Gateway depois de ativar `voice-call`; alterações de configuração de plugin
não aparecem em um processo Gateway já em execução até que ele seja recarregado.

Então verifique:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Quando a delegação da Twilio estiver conectada, `googlemeet setup` inclui verificações bem-sucedidas
de `twilio-voice-call-plugin`, `twilio-voice-call-credentials` e
`twilio-voice-call-webhook`.

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

## OAuth e pré-verificação

OAuth é opcional para criar um link do Meet porque `googlemeet create` pode recorrer
à automação de navegador. Configure OAuth quando quiser criação pela API oficial,
resolução de espaço ou verificações de pré-verificação da API Meet Media.

O acesso à API Google Meet usa OAuth de usuário: crie um cliente OAuth do Google Cloud,
solicite os escopos necessários, autorize uma conta Google e então armazene o
token de atualização resultante na configuração do plugin Google Meet ou forneça as
variáveis de ambiente `OPENCLAW_GOOGLE_MEET_*`.

OAuth não substitui o caminho de entrada pelo Chrome. Os transportes Chrome e Chrome-node
ainda entram por meio de um perfil Chrome conectado, BlackHole/SoX e um nó conectado
quando você usa participação pelo navegador. OAuth é somente para o caminho oficial da API Google
Meet: criar espaços de reunião, resolver espaços e executar verificações de pré-verificação da API Meet Media.

### Criar credenciais do Google

No Google Cloud Console:

1. Crie ou selecione um projeto do Google Cloud.
2. Ative a **Google Meet REST API** para esse projeto.
3. Configure a tela de consentimento OAuth.
   - **Interno** é mais simples para uma organização Google Workspace.
   - **Externo** funciona para configurações pessoais/de teste; enquanto o app estiver em Teste,
     adicione cada conta Google que autorizará o app como usuário de teste.
4. Adicione os escopos que o OpenClaw solicita:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Crie um ID de cliente OAuth.
   - Tipo de aplicativo: **Aplicativo Web**.
   - URI de redirecionamento autorizado:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Copie o ID do cliente e o segredo do cliente.

`meetings.space.created` é exigido por `spaces.create` do Google Meet.
`meetings.space.readonly` permite que o OpenClaw resolva URLs/códigos do Meet para espaços.
`meetings.space.settings` permite que o OpenClaw passe configurações `SpaceConfig`, como
`accessType`, durante a criação de sala pela API.
`meetings.conference.media.readonly` é para pré-verificação da API Meet Media e trabalho de mídia;
o Google pode exigir inscrição no Developer Preview para uso real da API Media.
Se você precisa apenas de entradas pelo Chrome baseadas em navegador, ignore OAuth completamente.

### Emitir o token de atualização

Configure `oauth.clientId` e opcionalmente `oauth.clientSecret`, ou passe-os como
variáveis de ambiente, então execute:

```bash
openclaw googlemeet auth login --json
```

O comando imprime um bloco de configuração `oauth` com um token de atualização. Ele usa PKCE,
callback localhost em `http://localhost:8085/oauth2callback` e um fluxo manual
de copiar/colar com `--manual`.

Exemplos:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Use o modo manual quando o navegador não conseguir acessar o callback local:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

A saída JSON inclui:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

Armazene o objeto `oauth` na configuração do plugin Google Meet:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

Prefira variáveis de ambiente quando não quiser o token de atualização na configuração.
Se valores de configuração e de ambiente estiverem presentes, o plugin resolve a configuração
primeiro e depois o fallback de ambiente.

O consentimento OAuth inclui criação de espaço do Meet, acesso de leitura a espaço do Meet e acesso
de leitura à mídia de conferência do Meet. Se você autenticou antes de existir suporte à criação de reunião,
execute novamente `openclaw googlemeet auth login --json` para que o token de atualização
tenha o escopo `meetings.space.created`.

### Verificar OAuth com doctor

Execute o doctor OAuth quando quiser uma verificação de integridade rápida e sem segredos:

```bash
openclaw googlemeet doctor --oauth --json
```

Isso não carrega o runtime do Chrome nem exige um nó Chrome conectado. Ele
verifica se a configuração OAuth existe e se o token de atualização consegue emitir um token de acesso.
O relatório JSON inclui apenas campos de status como `ok`, `configured`,
`tokenSource`, `expiresAt` e mensagens de verificação; ele não imprime o token de acesso,
token de atualização nem segredo do cliente.

Resultados comuns:

| Verificação         | Significado                                                                            |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` mais `oauth.refreshToken`, ou um token de acesso em cache, está presente. |
| `oauth-token`        | O token de acesso em cache ainda é válido, ou o token de atualização emitiu um novo token de acesso. |
| `meet-spaces-get`    | A verificação opcional `--meeting` resolveu um espaço do Meet existente.                |
| `meet-spaces-create` | A verificação opcional `--create-space` criou um novo espaço do Meet.                   |

Para comprovar também a ativação da API do Google Meet e o escopo `spaces.create`, execute a
verificação de criação com efeito colateral:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` cria uma URL descartável do Meet. Use-o quando precisar confirmar
que o projeto do Google Cloud tem a API do Meet ativada e que a conta autorizada
tem o escopo `meetings.space.created`.

Para comprovar acesso de leitura a um espaço de reunião existente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` e `resolve-space` comprovam acesso de leitura a um
espaço existente que a conta autorizada do Google pode acessar. Um `403` nessas verificações
geralmente significa que a API REST do Google Meet está desativada, que o token de atualização
consentido não tem o escopo necessário, ou que a conta do Google não consegue acessar esse espaço do Meet.
Um erro de token de atualização significa executar novamente `openclaw googlemeet auth login
--json` e armazenar o novo bloco `oauth`.

Nenhuma credencial OAuth é necessária para o fallback do navegador. Nesse modo, a autenticação do Google
vem do perfil do Chrome conectado no nó selecionado, não da configuração do
OpenClaw.

Estas variáveis de ambiente são aceitas como fallbacks:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` or `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` or `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` or `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` or `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` or
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` or `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` or `GOOGLE_MEET_PREVIEW_ACK`

Resolva uma URL do Meet, código ou `spaces/{id}` por meio de `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Execute a pré-verificação antes do trabalho de mídia:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Liste artefatos da reunião e presença depois que o Meet tiver criado registros de conferência:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Com `--meeting`, `artifacts` e `attendance` usam por padrão o registro de conferência mais recente.
Passe `--all-conference-records` quando quiser todos os registros retidos
para essa reunião.

A consulta ao Calendar pode resolver a URL da reunião a partir do Google Calendar antes de ler
artefatos do Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` pesquisa no calendário `primary` de hoje por um evento do Calendar com um
link do Google Meet. Use `--event <query>` para pesquisar texto de evento correspondente, e
`--calendar <id>` para um calendário não primário. A consulta ao Calendar exige um novo
login OAuth que inclua o escopo somente leitura de eventos do Calendar.
`calendar-events` pré-visualiza os eventos do Meet correspondentes e marca o evento que
`latest`, `artifacts`, `attendance` ou `export` escolherá.

Se você já souber o ID do registro de conferência, enderece-o diretamente:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Encerre uma conferência ativa para um espaço criado por API quando quiser fechar a
sala depois da chamada:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Isso chama `spaces.endActiveConference` do Google Meet e exige OAuth com o
escopo `meetings.space.created` para um espaço que a conta autorizada pode gerenciar.
O OpenClaw aceita uma URL do Meet, código de reunião ou entrada `spaces/{id}` e a resolve
para o recurso de espaço da API antes de encerrar a conferência ativa.
Isso é separado de `googlemeet leave`: `leave` interrompe a participação local/de sessão
do OpenClaw, enquanto `end-active-conference` pede ao Google Meet para encerrar a conferência ativa
do espaço.

Escreva um relatório legível:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` retorna metadados do registro de conferência mais metadados de recursos de participante, gravação,
transcrição, entrada de transcrição estruturada e notas inteligentes quando
o Google os expõe para a reunião. Use `--no-transcript-entries` para pular
a consulta de entradas em reuniões grandes. `attendance` expande participantes em
linhas de sessão de participante com horários de primeira/última visualização, duração total da sessão,
sinalizadores de atraso/saída antecipada e recursos de participantes duplicados mesclados por usuário conectado
ou nome de exibição. Passe `--no-merge-duplicates` para manter recursos brutos de participante
separados, `--late-after-minutes` para ajustar a detecção de atraso e
`--early-before-minutes` para ajustar a detecção de saída antecipada.

`export` grava uma pasta contendo `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` e `manifest.json`.
`manifest.json` registra a entrada escolhida, opções de exportação, registros de conferência,
arquivos de saída, contagens, fonte do token, evento do Calendar quando um foi usado e quaisquer
avisos de recuperação parcial. Passe `--zip` para também gravar um arquivo portátil ao lado
da pasta. Passe `--include-doc-bodies` para exportar texto de Google Docs vinculados de transcrição e
notas inteligentes por meio de `files.export` do Google Drive; isso exige um
novo login OAuth que inclua o escopo somente leitura do Drive Meet. Sem
`--include-doc-bodies`, as exportações incluem apenas metadados do Meet e entradas estruturadas de transcrição.
Se o Google retornar uma falha parcial de artefato, como um erro de listagem de notas inteligentes,
entrada de transcrição ou corpo de documento do Drive, o resumo e o
manifesto mantêm o aviso em vez de falhar toda a exportação.
Use `--dry-run` para buscar os mesmos dados de artefatos/presença e imprimir o
JSON do manifesto sem criar a pasta ou o ZIP. Isso é útil antes de gravar
uma exportação grande ou quando um agente precisa apenas de contagens, registros selecionados e
avisos.

Os agentes também podem criar o mesmo pacote por meio da ferramenta `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Defina `"dryRun": true` para retornar apenas o manifesto de exportação e pular gravações de arquivos.

Os agentes também podem criar uma sala com suporte de API usando uma política de acesso explícita:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

E podem encerrar a conferência ativa de uma sala conhecida:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Para validação ouvindo primeiro, os agentes devem usar `test_listen` antes de afirmar que a
reunião é útil:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Execute o smoke test ao vivo protegido contra uma reunião real retida:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Execute a sondagem ao vivo do navegador ouvindo primeiro contra uma reunião em que alguém vá
falar com legendas do Meet disponíveis:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Ambiente de smoke test ao vivo:

- `OPENCLAW_LIVE_TEST=1` habilita testes ao vivo protegidos.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` aponta para uma URL do Meet retida, código ou
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` or `GOOGLE_MEET_CLIENT_ID` fornece o ID do cliente OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` or `GOOGLE_MEET_REFRESH_TOKEN` fornece
  o token de atualização.
- Opcional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` e
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` usam os mesmos nomes de fallback
  sem o prefixo `OPENCLAW_`.

O smoke test ao vivo base de artefatos/presença precisa de
`https://www.googleapis.com/auth/meetings.space.readonly` e
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. A consulta ao Calendar
precisa de `https://www.googleapis.com/auth/calendar.events.readonly`. A exportação de corpo de documento do Drive
precisa de
`https://www.googleapis.com/auth/drive.meet.readonly`.

Crie um novo espaço do Meet:

```bash
openclaw googlemeet create
```

O comando imprime o novo `meeting uri`, fonte e sessão de entrada. Com credenciais OAuth,
ele usa a API oficial do Google Meet. Sem credenciais OAuth, ele
usa como fallback o perfil de navegador conectado do nó Chrome fixado. Agentes podem
usar a ferramenta `google_meet` com `action: "create"` para criar e entrar em uma
etapa. Para criação apenas da URL, passe `"join": false`.

Exemplo de saída JSON do fallback do navegador:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Se o fallback do navegador encontrar login do Google ou um bloqueador de permissão do Meet antes de
conseguir criar a URL, o método do Gateway retorna uma resposta com falha e a
ferramenta `google_meet` retorna detalhes estruturados em vez de uma string simples:

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

Quando um agente vê `manualActionRequired: true`, ele deve relatar a
`manualActionMessage` mais o contexto do nó/aba do navegador e parar de abrir novas
abas do Meet até que o operador conclua a etapa no navegador.

Exemplo de saída JSON da criação por API:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Criar uma reunião do Meet entra por padrão. O transporte Chrome ou Chrome-node ainda
precisa de um perfil do Google Chrome conectado para entrar pelo navegador. Se o
perfil estiver desconectado, o OpenClaw relata `manualActionRequired: true` ou um
erro de fallback do navegador e pede que o operador conclua o login do Google antes
de tentar novamente.

Defina `preview.enrollmentAcknowledged: true` somente depois de confirmar que seu
projeto Cloud, principal OAuth e participantes da reunião estão inscritos no Google
Workspace Developer Preview Program para APIs de mídia do Meet.

## Configuração

O caminho comum do agente Chrome precisa apenas do Plugin habilitado, BlackHole, SoX, uma
chave de provedor de transcrição em tempo real e um provedor de TTS do OpenClaw
configurado. OpenAI é o provedor de transcrição padrão; defina
`realtime.voiceProvider` como `"google"` e `realtime.model` para usar o Google
Gemini Live no modo `bidi` sem alterar o provedor de transcrição padrão do modo de
agente:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Defina a configuração do Plugin em `plugins.entries.google-meet.config`:

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
- `defaultMode: "agent"` (`"realtime"` é aceito apenas como alias de compatibilidade
  legado para `"agent"`; novas chamadas de ferramenta devem dizer `"agent"`)
- `chromeNode.node`: id/nome/IP opcional do Node para `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nome usado na tela de convidado desconectado
  do Meet
- `chrome.autoJoin: true`: preenchimento de nome de convidado e clique em Entrar
  agora em melhor esforço pela automação de navegador do OpenClaw em `chrome-node`
- `chrome.reuseExistingTab: true`: ativar uma aba existente do Meet em vez de abrir
  duplicatas
- `chrome.waitForInCallMs: 20000`: aguardar a aba do Meet relatar que está em chamada
  antes que a introdução de retorno por voz seja acionada
- `chrome.audioFormat: "pcm16-24khz"`: formato de áudio de par de comandos. Use
  `"g711-ulaw-8khz"` apenas para pares de comandos legados/personalizados que ainda
  emitem áudio de telefonia.
- `chrome.audioBufferBytes: 4096`: buffer de processamento do SoX para comandos de
  áudio de par de comandos do Chrome gerados. Isso é metade do buffer padrão de 8192
  bytes do SoX, reduzindo a latência padrão do pipe enquanto deixa margem para
  aumentá-lo em hosts ocupados. Valores abaixo do mínimo do SoX são limitados a 17
  bytes.
- `chrome.audioInputCommand`: comando SoX que lê do CoreAudio `BlackHole 2ch`
  e grava áudio em `chrome.audioFormat`
- `chrome.audioOutputCommand`: comando SoX que lê áudio em `chrome.audioFormat`
  e grava no CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: comando opcional de microfone local que grava PCM
  mono little-endian assinado de 16 bits para detecção de interrupção humana enquanto
  a reprodução do assistente está ativa. Atualmente isso se aplica à ponte de par de
  comandos `chrome` hospedada pelo Gateway.
- `chrome.bargeInRmsThreshold: 650`: nível RMS que conta como uma interrupção humana
  em `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: nível de pico que conta como uma interrupção
  humana em `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: atraso mínimo entre limpezas repetidas de
  interrupção humana
- `mode: "agent"`: modo padrão de retorno por voz. A fala dos participantes é
  transcrita pelo provedor de transcrição em tempo real configurado, enviada ao
  agente OpenClaw configurado em uma sessão de subagente por reunião e falada de
  volta pelo runtime normal de TTS do OpenClaw.
- `mode: "bidi"`: modo de fallback de modelo em tempo real bidirecional direto. O
  provedor de voz em tempo real responde diretamente à fala dos participantes e pode
  chamar `openclaw_agent_consult` para respostas mais profundas/com suporte de
  ferramentas.
- `mode: "transcribe"`: modo somente observação sem a ponte de retorno por voz.
- `realtime.provider: "openai"`: fallback de compatibilidade usado quando os campos
  de provedor com escopo abaixo não estão definidos.
- `realtime.transcriptionProvider: "openai"`: id do provedor usado pelo modo `agent`
  para transcrição em tempo real.
- `realtime.voiceProvider`: id do provedor usado pelo modo `bidi` para voz direta em
  tempo real. Defina isto como `"google"` para usar Gemini Live mantendo a transcrição
  do modo de agente na OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: respostas faladas breves, com
  `openclaw_agent_consult` para respostas mais profundas
- `realtime.introMessage`: breve verificação falada de prontidão quando a ponte em
  tempo real se conecta; defina como `""` para entrar silenciosamente
- `realtime.agentId`: id opcional do agente OpenClaw para
  `openclaw_agent_consult`; o padrão é `main`

Substituições opcionais:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  browser: {
    defaultProfile: "openclaw",
  },
  chrome: {
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
    bargeInInputCommand: [
      "sox",
      "-q",
      "-t",
      "coreaudio",
      "External Microphone",
      "-r",
      "24000",
      "-c",
      "1",
      "-b",
      "16",
      "-e",
      "signed-integer",
      "-t",
      "raw",
      "-",
    ],
  },
  chromeNode: {
    node: "parallels-macos",
  },
  defaultMode: "agent",
  realtime: {
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        speakerVoice: "Kore",
      },
    },
  },
}
```

ElevenLabs para escuta e fala no modo de agente:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        },
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

A voz persistente do Meet vem de
`messages.tts.providers.elevenlabs.speakerVoiceId`. As respostas do agente também
podem usar diretivas por resposta `[[tts:speakerVoiceId=... model=eleven_v3]]`
quando substituições de modelo TTS estão habilitadas, mas a configuração é o padrão
determinístico para reuniões. Ao entrar, os logs devem mostrar
`transcriptionProvider=elevenlabs` e cada resposta falada deve registrar
`provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

Configuração somente para Twilio:

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

`voiceCall.enabled` usa `true` por padrão; com transporte Twilio, ele delega a
chamada PSTN real, DTMF e saudação introdutória ao Plugin Voice Call. Voice Call
reproduz a sequência DTMF antes de abrir o fluxo de mídia em tempo real e então usa
o texto de introdução salvo como a saudação inicial em tempo real. Se `voice-call`
não estiver habilitado, o Google Meet ainda pode validar e registrar o plano de
discagem, mas não pode fazer a chamada Twilio.

## Ferramenta

Agentes podem usar a ferramenta `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Use `transport: "chrome"` quando o Chrome roda no host do Gateway. Use
`transport: "chrome-node"` quando o Chrome roda em um Node pareado, como uma VM
Parallels. Em ambos os casos, os provedores de modelo e `openclaw_agent_consult`
rodam no host do Gateway, então as credenciais de modelo ficam lá. Com o
`mode: "agent"` padrão, o provedor de transcrição em tempo real cuida da escuta, o
agente OpenClaw configurado produz a resposta, e o TTS regular do OpenClaw a fala no
Meet. Use `mode: "bidi"` quando quiser que o modelo de voz em tempo real responda
diretamente. `mode: "realtime"` bruto continua aceito como alias de compatibilidade
legado para `mode: "agent"`, mas não é mais anunciado no schema da ferramenta do
agente. Logs do modo de agente incluem o provedor/modelo de transcrição resolvido na
inicialização da ponte e o provedor TTS, modelo, voz, formato de saída e taxa de
amostragem após cada resposta sintetizada.

Use `action: "status"` para listar sessões ativas ou inspecionar um ID de sessão.
Use `action: "speak"` com `sessionId` e `message` para fazer o agente em tempo real
falar imediatamente. Use `action: "test_speech"` para criar ou reutilizar a sessão,
acionar uma frase conhecida e retornar a integridade `inCall` quando o host Chrome
puder relatá-la. `test_speech` sempre força `mode: "agent"` e falha se solicitado a
rodar em `mode: "transcribe"`, porque sessões somente observação intencionalmente não
podem emitir fala. Seu resultado `speechOutputVerified` é baseado no aumento de bytes
de saída de áudio em tempo real durante essa chamada de teste, então uma sessão
reutilizada com áudio mais antigo não conta como uma verificação de fala bem-sucedida
recente. Use `action: "leave"` para marcar uma sessão como encerrada.

`status` inclui a integridade do Chrome quando disponível:

- `inCall`: o Chrome parece estar dentro da chamada do Meet
- `micMuted`: estado do microfone do Meet em melhor esforço
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: o perfil do
  navegador precisa de login manual, admissão pelo host do Meet, permissões ou reparo
  de controle do navegador antes que a fala possa funcionar
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: se a fala
  gerenciada do Chrome é permitida agora. `speechReady: false` significa que o
  OpenClaw não enviou a frase de introdução/teste para a ponte de áudio.
- `providerConnected` / `realtimeReady`: estado da ponte de voz em tempo real
- `lastInputAt` / `lastOutputAt`: último áudio visto vindo da ponte ou enviado para ela
- `audioOutputRouted` / `audioOutputDeviceLabel`: se a saída de mídia da aba do Meet
  foi roteada ativamente para o dispositivo BlackHole usado pela ponte
- `lastSuppressedInputAt` / `suppressedInputBytes`: entrada de loopback ignorada
  enquanto a reprodução do assistente está ativa

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Modos agent e bidi

O modo `agent` do Chrome é otimizado para o comportamento "meu agente está na
reunião". O provedor de transcrição em tempo real ouve o áudio da reunião,
transcrições finais dos participantes são roteadas pelo agente OpenClaw configurado,
e a resposta é falada pelo runtime normal de TTS do OpenClaw. Defina
`mode: "bidi"` quando quiser que o modelo de voz em tempo real responda diretamente.
Fragmentos próximos de transcrição final são consolidados antes da consulta para que
um turno falado não produza várias respostas parciais obsoletas. A entrada em tempo
real também é suprimida enquanto o áudio enfileirado do assistente ainda está
tocando, e ecos recentes de transcrição semelhantes ao assistente são ignorados antes
da consulta ao agente para que o loopback do BlackHole não faça o agente responder à
própria fala.

| Modo    | Quem decide a resposta        | Caminho de saída de fala                | Use quando                                             |
| ------- | ----------------------------- | --------------------------------------- | ------------------------------------------------------ |
| `agent` | O agente OpenClaw configurado | Runtime normal de TTS do OpenClaw       | Você quer o comportamento "meu agente está na reunião" |
| `bidi`  | O modelo de voz em tempo real | Resposta de áudio do provedor de voz em tempo real | Você quer o loop de voz conversacional de menor latência |

No modo `bidi`, quando o modelo em tempo real precisa de raciocínio mais profundo,
informações atuais ou ferramentas normais do OpenClaw, ele pode chamar
`openclaw_agent_consult`.

A ferramenta de consulta executa o agente OpenClaw normal nos bastidores com o
contexto recente da transcrição da reunião e retorna uma resposta falada concisa. No modo `agent`,
o OpenClaw envia essa resposta diretamente para o runtime de TTS; no modo `bidi`, o
modelo de voz em tempo real pode falar o resultado da consulta de volta na reunião. Ela usa
o mesmo mecanismo compartilhado de consulta do Voice Call.

Por padrão, as consultas são executadas no agente `main`. Defina `realtime.agentId` quando uma
faixa do Meet deve consultar um workspace de agente OpenClaw dedicado, padrões de modelo,
política de ferramentas, memória e histórico de sessão.

Consultas em modo agente usam uma chave de sessão por reunião `agent:<id>:subagent:google-meet:<session>`
para que perguntas de acompanhamento mantenham o contexto da reunião enquanto herdam a política normal
do agente configurado.

`realtime.toolPolicy` controla a execução da consulta:

- `safe-read-only`: expõe a ferramenta de consulta e limita o agente normal a
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e
  `memory_get`.
- `owner`: expõe a ferramenta de consulta e permite que o agente normal use a política
  normal de ferramentas do agente.
- `none`: não expõe a ferramenta de consulta para o modelo de voz em tempo real.

A chave de sessão da consulta tem escopo por sessão do Meet, então chamadas de consulta de acompanhamento
podem reutilizar o contexto de consultas anteriores durante a mesma reunião.

Para forçar uma verificação falada de prontidão depois que o Chrome tiver entrado completamente na chamada:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Para o smoke completo de entrada e fala:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Checklist de teste ao vivo

Use esta sequência antes de entregar uma reunião a um agente não supervisionado:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Estado esperado do Chrome-node:

- `googlemeet setup` está todo verde.
- `googlemeet setup` inclui `chrome-node-connected` quando Chrome-node é o
  transporte padrão ou um nó está fixado.
- `nodes status` mostra o nó selecionado conectado.
- O nó selecionado anuncia tanto `googlemeet.chrome` quanto `browser.proxy`.
- A aba do Meet entra na chamada e `test-speech` retorna a integridade do Chrome com
  `inCall: true`.

Para um host Chrome remoto, como uma VM macOS do Parallels, esta é a verificação segura
mais curta depois de atualizar o Gateway ou a VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Isso comprova que o Plugin do Gateway está carregado, que o nó da VM está conectado com o
token atual e que a ponte de áudio do Meet está disponível antes que um agente abra uma
aba de reunião real.

Para um smoke do Twilio, use uma reunião que exponha detalhes de discagem telefônica:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Estado esperado do Twilio:

- `googlemeet setup` inclui verificações verdes de `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials` e `twilio-voice-call-webhook`.
- `voicecall` está disponível na CLI após o recarregamento do Gateway.
- A sessão retornada tem `transport: "twilio"` e um `twilio.voiceCallId`.
- `openclaw logs --follow` mostra DTMF TwiML servido antes de TwiML em tempo real, depois uma
  ponte em tempo real com a saudação inicial enfileirada.
- `googlemeet leave <sessionId>` encerra a chamada de voz delegada.

## Solução de problemas

### O agente não consegue ver a ferramenta do Google Meet

Confirme se o Plugin está habilitado na configuração do Gateway e recarregue o Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Se você acabou de editar `plugins.entries.google-meet`, reinicie ou recarregue o Gateway.
O agente em execução só vê ferramentas de Plugin registradas pelo processo atual do Gateway.

Em hosts Gateway que não são macOS, a ferramenta voltada ao agente `google_meet` permanece visível,
mas ações locais de retorno de fala do Chrome são bloqueadas antes de chegarem à ponte de áudio.
O áudio local de retorno de fala do Chrome atualmente depende do `BlackHole 2ch` do macOS, então
agentes Linux devem usar `mode: "transcribe"`, discagem Twilio ou um host macOS
`chrome-node` em vez do caminho padrão de agente local do Chrome.

### Nenhum nó compatível com Google Meet conectado

No host do nó, execute:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

No host do Gateway, aprove o nó e verifique os comandos:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

O nó deve estar conectado e listar `googlemeet.chrome` mais `browser.proxy`.
A configuração do Gateway deve permitir esses comandos de nó:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Se `googlemeet setup` falhar em `chrome-node-connected` ou o log do Gateway relatar
`gateway token mismatch`, reinstale ou reinicie o nó com o token atual do Gateway.
Para um Gateway em LAN, isso geralmente significa:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Depois recarregue o serviço do nó e execute novamente:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### O navegador abre, mas o agente não consegue entrar

Execute `googlemeet test-listen` para entradas somente de observação ou `googlemeet test-speech`
para entradas em tempo real, depois inspecione a integridade do Chrome retornada. Se qualquer uma das sondagens
relatar `manualActionRequired: true`, mostre `manualActionMessage` ao operador
e pare de tentar novamente até que a ação do navegador esteja concluída.

Ações manuais comuns:

- Entrar no perfil do Chrome.
- Admitir o convidado pela conta host do Meet.
- Conceder permissões de microfone/câmera ao Chrome quando o prompt nativo de permissão do Chrome aparecer.
- Fechar ou reparar uma caixa de diálogo de permissão do Meet travada.

Não relate "não conectado" só porque o Meet mostra "Você quer que as pessoas
ouçam você na reunião?" Esse é o intersticial de escolha de áudio do Meet; o OpenClaw
clica em **Usar microfone** por automação do navegador quando disponível e continua
aguardando o estado real da reunião. Para fallback de navegador somente para criação, o OpenClaw
pode clicar em **Continuar sem microfone** porque criar a URL não precisa
do caminho de áudio em tempo real.

### A criação da reunião falha

`googlemeet create` primeiro usa o endpoint `spaces.create` da API do Google Meet
quando credenciais OAuth estão configuradas. Sem credenciais OAuth, ele recorre
ao navegador do nó Chrome fixado. Confirme:

- Para criação por API: `oauth.clientId` e `oauth.refreshToken` estão configurados,
  ou variáveis de ambiente correspondentes `OPENCLAW_GOOGLE_MEET_*` estão presentes.
- Para criação por API: o token de atualização foi emitido depois que o suporte a criação foi
  adicionado. Tokens mais antigos podem não ter o escopo `meetings.space.created`; execute novamente
  `openclaw googlemeet auth login --json` e atualize a configuração do Plugin.
- Para fallback de navegador: `defaultTransport: "chrome-node"` e
  `chromeNode.node` apontam para um nó conectado com `browser.proxy` e
  `googlemeet.chrome`.
- Para fallback de navegador: o perfil Chrome do OpenClaw nesse nó está conectado
  ao Google e consegue abrir `https://meet.google.com/new`.
- Para fallback de navegador: novas tentativas reutilizam uma aba existente de `https://meet.google.com/new`
  ou de prompt de conta Google antes de abrir uma nova aba. Se um agente atingir timeout,
  tente novamente a chamada da ferramenta em vez de abrir manualmente outra aba do Meet.
- Para fallback de navegador: se a ferramenta retornar `manualActionRequired: true`, use
  `browser.nodeId`, `browser.targetId`, `browserUrl` e
  `manualActionMessage` retornados para orientar o operador. Não tente novamente em loop até que essa
  ação esteja concluída.
- Para fallback de navegador: se o Meet mostrar "Você quer que as pessoas ouçam você na
  reunião?", deixe a aba aberta. O OpenClaw deve clicar em **Usar microfone** ou, para
  fallback somente de criação, em **Continuar sem microfone** por automação do navegador
  e continuar aguardando a URL do Meet gerada. Se não conseguir, o
  erro deve mencionar `meet-audio-choice-required`, não `google-login-required`.

### O agente entra, mas não fala

Verifique o caminho em tempo real:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Use `mode: "agent"` para o caminho normal STT -> agente OpenClaw -> retorno de fala TTS,
ou `mode: "bidi"` para o fallback direto de voz em tempo real. `mode: "transcribe"`
intencionalmente não inicia a ponte de retorno de fala. Para depuração somente de observação,
execute `openclaw googlemeet status --json <session-id>` depois que participantes falarem
e verifique `captioning`, `transcriptLines` e `lastCaptionText`. Se `inCall` for
true mas `transcriptLines` permanecer em `0`, as legendas do Meet podem estar desativadas, ninguém
falou desde que o observador foi instalado, a interface do Meet mudou ou legendas ao vivo
não estão disponíveis para o idioma/conta da reunião.

`googlemeet test-speech` sempre verifica o caminho em tempo real e relata se
bytes de saída da ponte foram observados para essa invocação. Se `speechOutputVerified` for false e
`speechOutputTimedOut` for true, o provedor em tempo real pode ter aceitado a
fala, mas o OpenClaw não viu novos bytes de saída chegarem à ponte de áudio do Chrome.

Também verifique:

- Uma chave de provedor em tempo real está disponível no host do Gateway, como
  `OPENAI_API_KEY` ou `GEMINI_API_KEY`.
- `BlackHole 2ch` está visível no host Chrome.
- `sox` existe no host Chrome.
- O microfone e o alto-falante do Meet estão roteados pelo caminho de áudio virtual usado pelo
  OpenClaw. `doctor` deve mostrar `meet output routed: yes` para entradas locais do Chrome
  em tempo real.

`googlemeet doctor [session-id]` imprime a sessão, o nó, o estado em chamada,
o motivo de ação manual, a conexão do provedor em tempo real, `realtimeReady`, atividade de
entrada/saída de áudio, últimos timestamps de áudio, contadores de bytes e URL do navegador.
Use `googlemeet status [session-id] --json` quando precisar do JSON bruto. Use
`googlemeet doctor --oauth` quando precisar verificar a atualização OAuth do Google Meet
sem expor tokens; adicione `--meeting` ou `--create-space` quando também precisar de uma
prova da API do Google Meet.

Se um agente atingiu timeout e você consegue ver uma aba do Meet já aberta, inspecione essa aba
sem abrir outra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

A ação de ferramenta equivalente é `recover_current_tab`. Ela foca e inspeciona uma
aba existente do Meet para o transporte selecionado. Com `chrome`, ela usa controle local
do navegador por meio do Gateway; com `chrome-node`, ela usa o nó Chrome configurado.
Ela não abre uma nova aba nem cria uma nova sessão; relata o bloqueador
atual, como login, admissão, permissões ou estado de escolha de áudio.
O comando CLI conversa com o Gateway configurado, então o Gateway deve estar em execução;
`chrome-node` também exige que o nó Chrome esteja conectado.

### Verificações de configuração do Twilio falham

`twilio-voice-call-plugin` falha quando `voice-call` não está permitido ou não está habilitado.
Adicione-o a `plugins.allow`, habilite `plugins.entries.voice-call` e recarregue o
Gateway.

`twilio-voice-call-credentials` falha quando o backend Twilio não tem SID da conta,
token de autenticação ou número chamador. Defina estes no host do Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` falha quando `voice-call` não tem exposição pública de Webhook,
ou quando `publicUrl` aponta para local loopback ou espaço de rede privada.
Defina `plugins.entries.voice-call.config.publicUrl` como a URL pública do provedor ou
configure uma exposição por túnel/Tailscale de `voice-call`.

URLs de loopback e privadas não são válidas para callbacks de operadora. Não use
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` ou `fd00::/8` como `publicUrl`.

Para uma URL pública estável:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          fromNumber: "+15550001234",
          publicUrl: "https://voice.example.com/voice/webhook",
        },
      },
    },
  },
}
```

Para desenvolvimento local, use um túnel ou exposição via Tailscale em vez de uma URL
de host privado:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Em seguida, reinicie ou recarregue o Gateway e execute:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` verifica apenas a prontidão por padrão. Para simular com um número específico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Adicione `--yes` somente quando você quiser intencionalmente fazer uma chamada
de notificação de saída ao vivo:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### A chamada Twilio começa, mas nunca entra na reunião

Confirme se o evento do Meet expõe os detalhes de discagem telefônica. Passe o número
de discagem exato e o PIN ou uma sequência DTMF personalizada:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Use `w` inicial ou vírgulas em `--dtmf-sequence` se o provedor precisar de uma pausa
antes de inserir o PIN.

Se a chamada telefônica for criada, mas a lista de participantes do Meet nunca mostrar
o participante por discagem telefônica:

- Execute `openclaw googlemeet doctor <session-id>` para confirmar o ID delegado da
  chamada Twilio, se o DTMF foi enfileirado e se a saudação introdutória foi solicitada.
- Execute `openclaw voicecall status --call-id <id>` e confirme se a chamada ainda
  está ativa.
- Execute `openclaw voicecall tail` e verifique se os Webhooks do Twilio estão chegando
  ao Gateway.
- Execute `openclaw logs --follow` e procure a sequência do Twilio Meet: o Google
  Meet delega a entrada, o Voice Call armazena e serve o TwiML de DTMF pré-conexão,
  o Voice Call serve TwiML em tempo real para a chamada Twilio e, em seguida, o Google Meet solicita
  a fala introdutória com `voicecall.speak`.
- Execute novamente `openclaw googlemeet setup --transport twilio`; uma verificação de setup
  verde é obrigatória, mas não prova que a sequência do PIN da reunião está correta.
- Confirme se o número de discagem pertence ao mesmo convite e à mesma região do Meet que
  o PIN.
- Aumente `voiceCall.dtmfDelayMs` em relação ao padrão de 12 segundos se o Meet atender
  lentamente ou se a transcrição da chamada ainda mostrar o prompt pedindo um PIN depois que
  o DTMF pré-conexão tiver sido enviado.
- Se o participante entrar, mas você não ouvir a saudação, verifique
  `openclaw logs --follow` em busca da solicitação `voicecall.speak` pós-DTMF e
  da reprodução de TTS por fluxo de mídia ou do fallback `<Say>` do Twilio. Se a
  transcrição da chamada ainda contiver "enter the meeting PIN", a perna telefônica ainda não entrou
  na sala do Meet, portanto os participantes da reunião não ouvirão a fala.

Se os Webhooks não chegarem, depure primeiro o Plugin Voice Call: o provedor deve
alcançar `plugins.entries.voice-call.config.publicUrl` ou o túnel configurado.
Veja [Solução de problemas de chamadas de voz](/pt-BR/plugins/voice-call#troubleshooting).

## Observações

A API oficial de mídia do Google Meet é orientada a recebimento, portanto falar em uma chamada
do Meet ainda precisa de um caminho de participante. Este Plugin mantém esse limite visível:
o Chrome lida com a participação pelo navegador e o roteamento de áudio local; o Twilio lida com
a participação por discagem telefônica.

Os modos de resposta do Chrome precisam de `BlackHole 2ch` mais uma destas opções:

- `chrome.audioInputCommand` mais `chrome.audioOutputCommand`: o OpenClaw é dono da
  ponte e canaliza áudio em `chrome.audioFormat` entre esses comandos e o
  provedor selecionado. O modo de agente usa transcrição em tempo real mais TTS regular;
  o modo bidi usa o provedor de voz em tempo real. O caminho padrão do Chrome é PCM16 de 24 kHz
  com `chrome.audioBufferBytes: 4096`; G.711 mu-law de 8 kHz continua
  disponível para pares de comandos legados.
- `chrome.audioBridgeCommand`: um comando de ponte externo é dono de todo o caminho
  de áudio local e deve sair após iniciar ou validar seu daemon. Isso só é
  válido para `bidi` porque o modo `agent` precisa de acesso direto ao par de comandos para TTS.

Quando um agente chama a ferramenta `google_meet` no modo de agente, a sessão de consultor
da reunião bifurca a transcrição atual do chamador antes de responder à fala dos participantes.
A sessão do Meet ainda permanece separada (`agent:<agentId>:subagent:google-meet:<sessionId>`)
para que acompanhamentos da reunião não alterem diretamente a transcrição do chamador.

Para áudio duplex limpo, roteie a saída do Meet e o microfone do Meet por dispositivos
virtuais separados ou por um grafo de dispositivos virtuais no estilo Loopback. Um único dispositivo
BlackHole compartilhado pode ecoar outros participantes de volta para a chamada.

Com a ponte do Chrome por par de comandos, `chrome.bargeInInputCommand` pode escutar um
microfone local separado e limpar a reprodução do assistente quando o humano começa
a falar. Isso mantém a fala humana à frente da saída do assistente mesmo quando a entrada
local loopback compartilhada do BlackHole é temporariamente suprimida durante a reprodução do assistente.
Assim como `chrome.audioInputCommand` e `chrome.audioOutputCommand`, ele é um
comando local configurado pelo operador. Use um caminho de comando confiável explícito ou
uma lista de argumentos, e não o aponte para scripts de locais não confiáveis.

`googlemeet speak` aciona a ponte de áudio de resposta ativa para uma sessão do Chrome.
`googlemeet leave` interrompe essa ponte. Para sessões do Twilio delegadas
por meio do Plugin Voice Call, `leave` também encerra a chamada de voz subjacente.
Use `googlemeet end-active-conference` quando você também quiser encerrar a conferência ativa
do Google Meet para um espaço gerenciado por API.

## Relacionado

- [Plugin Voice Call](/pt-BR/plugins/voice-call)
- [Modo de fala](/pt-BR/nodes/talk)
- [Criação de Plugins](/pt-BR/plugins/building-plugins)
