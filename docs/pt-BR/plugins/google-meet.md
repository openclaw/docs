---
read_when:
    - Você quer que um agente OpenClaw entre em uma chamada do Google Meet
    - Você quer que um agente do OpenClaw crie uma nova chamada do Google Meet
    - Você está configurando o Chrome, o nó do Chrome ou o Twilio como transporte do Google Meet
summary: 'Plugin do Google Meet: entrar em URLs explícitas do Meet via Chrome ou Twilio com padrões de voz em tempo real'
title: Plugin do Google Meet
x-i18n:
    generated_at: "2026-05-01T05:58:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b7f5505dcc0ee20a5331f1e41206c8a4fd4090f317799d3f8af0018a067772f
    source_path: plugins/google-meet.md
    workflow: 16
---

O suporte a participantes do Google Meet para o OpenClaw é explícito por design:

- Ele só entra em uma URL explícita `https://meet.google.com/...`.
- Ele pode criar um novo espaço do Meet pela API do Google Meet e então entrar na
  URL retornada.
- A voz `realtime` é o modo padrão.
- A voz em tempo real pode chamar de volta o agente completo do OpenClaw quando
  raciocínio mais profundo ou ferramentas forem necessários.
- Os agentes escolhem o comportamento de entrada com `mode`: use `realtime` para
  escuta/fala de retorno ao vivo, ou `transcribe` para entrar/controlar o
  navegador sem a ponte de voz em tempo real.
- A autenticação começa como Google OAuth pessoal ou um perfil do Chrome já
  conectado.
- Não há anúncio automático de consentimento.
- O backend de áudio padrão do Chrome é `BlackHole 2ch`.
- O Chrome pode executar localmente ou em um host de nó pareado.
- O Twilio aceita um número de discagem mais PIN ou sequência DTMF opcionais.
- O comando da CLI é `googlemeet`; `meet` fica reservado para fluxos de trabalho
  mais amplos de teleconferência do agente.

## Início rápido

Instale as dependências locais de áudio e configure um provedor de voz em tempo
real de backend. OpenAI é o padrão; Google Gemini Live também funciona com
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` instala o dispositivo de áudio virtual `BlackHole 2ch`. O
instalador do Homebrew exige uma reinicialização antes que o macOS exponha o
dispositivo:

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

A saída da configuração foi feita para ser legível por agentes e ciente do modo.
Ela informa o perfil do Chrome, a fixação de nó e, para entradas pelo Chrome em
tempo real, a ponte de áudio BlackHole/SoX e verificações de introdução em tempo
real atrasadas. Para entradas somente observação, verifique o mesmo transporte
com `--mode transcribe`; esse modo pula os pré-requisitos de áudio em tempo real
porque não escuta nem fala pela ponte:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Quando a delegação do Twilio está configurada, a configuração também informa se
o plugin `voice-call`, as credenciais do Twilio e a exposição pública do Webhook
estão prontos. Trate qualquer verificação `ok: false` como um bloqueador para o
transporte e modo verificados antes de pedir que um agente entre. Use
`openclaw googlemeet setup --json` para scripts ou saída legível por máquina.
Use `--transport chrome`, `--transport chrome-node` ou `--transport twilio` para
pré-verificar um transporte específico antes que um agente tente usá-lo.

Para Twilio, sempre pré-verifique o transporte explicitamente quando o transporte
padrão for Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Isso detecta fiação ausente de `voice-call`, credenciais do Twilio ou exposição
de Webhook inacessível antes que o agente tente ligar para a reunião.

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
  "mode": "realtime"
}
```

Crie uma nova reunião e entre nela:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Crie apenas a URL sem entrar:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` tem dois caminhos:

- Criação via API: usada quando credenciais OAuth do Google Meet estão
  configuradas. Este é o caminho mais determinístico e não depende do estado da
  IU do navegador.
- Fallback pelo navegador: usado quando as credenciais OAuth estão ausentes. O
  OpenClaw usa o nó Chrome fixado, abre `https://meet.google.com/new`, espera o
  Google redirecionar para uma URL real com código de reunião e então retorna
  essa URL. Esse caminho exige que o perfil do Chrome do OpenClaw no nó já esteja
  conectado ao Google.
  A automação do navegador lida com o próprio prompt de microfone de primeira
  execução do Meet; esse prompt não é tratado como falha de login do Google.
  Os fluxos de entrada e criação também tentam reutilizar uma aba existente do
  Meet antes de abrir uma nova. A correspondência ignora strings de consulta
  inofensivas de URL, como `authuser`, então uma nova tentativa do agente deve
  focar a reunião já aberta em vez de criar uma segunda aba do Chrome.

A saída do comando/ferramenta inclui um campo `source` (`api` ou `browser`) para
que agentes possam explicar qual caminho foi usado. `create` entra na nova
reunião por padrão e retorna `joined: true` mais a sessão de entrada. Para apenas
emitir a URL, use `create --no-join` na CLI ou passe `"join": false` para a
ferramenta.

Ou diga a um agente: "Crie um Google Meet, entre nele com voz em tempo real e me
envie o link." O agente deve chamar `google_meet` com `action: "create"` e então
compartilhar o `meetingUri` retornado.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Para uma entrada somente observação/controle de navegador, defina
`"mode": "transcribe"`. Isso não inicia a ponte duplex do modelo em tempo real,
não exige BlackHole ou SoX e não responderá com fala na reunião. Entradas pelo
Chrome nesse modo também evitam a concessão de permissão de microfone/câmera do
OpenClaw e evitam o caminho **Use microphone** do Meet. Se o Meet mostrar uma
tela intermediária de escolha de áudio, a automação tenta o caminho sem
microfone e, caso contrário, relata uma ação manual em vez de abrir o microfone
local.

Durante sessões em tempo real, o status de `google_meet` inclui a integridade do
navegador e da ponte de áudio, como `inCall`, `manualActionRequired`,
`providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`,
timestamps da última entrada/saída, contadores de bytes e estado fechado da
ponte. Se um prompt seguro da página do Meet aparecer, a automação do navegador
lida com ele quando consegue. Login, admissão pelo anfitrião e prompts de
permissão do navegador/SO são relatados como ação manual, com um motivo e uma
mensagem para o agente repassar. Sessões gerenciadas do Chrome só emitem a
introdução ou frase de teste depois que a integridade do navegador informa
`inCall: true`; caso contrário, o status informa `speechReady: false` e a
tentativa de fala é bloqueada em vez de fingir que o agente falou na reunião.

Entradas pelo Chrome local usam o perfil de navegador conectado do OpenClaw. O
modo em tempo real exige `BlackHole 2ch` para o caminho de microfone/alto-falante
usado pelo OpenClaw. Para áudio duplex limpo, use dispositivos virtuais separados
ou um grafo no estilo Loopback; um único dispositivo BlackHole é suficiente para
um primeiro teste smoke, mas pode gerar eco.

### Gateway local + Chrome no Parallels

Você **não** precisa de um Gateway OpenClaw completo nem de uma chave de API de
modelo dentro de uma VM macOS só para fazer a VM possuir o Chrome. Execute o
Gateway e o agente localmente e então execute um host de nó na VM. Habilite uma
vez o plugin incluído na VM para que o nó anuncie o comando do Chrome:

O que executa onde:

- Host do Gateway: Gateway OpenClaw, workspace do agente, chaves de modelo/API,
  provedor em tempo real e configuração do plugin Google Meet.
- VM macOS do Parallels: CLI/host de nó do OpenClaw, Google Chrome, SoX,
  BlackHole 2ch e um perfil do Chrome conectado ao Google.
- Não necessário na VM: serviço Gateway, configuração de agente, chave
  OpenAI/GPT ou configuração de provedor de modelo.

Instale as dependências da VM:

```bash
brew install blackhole-2ch sox
```

Reinicie a VM após instalar o BlackHole para que o macOS exponha
`BlackHole 2ch`:

```bash
sudo reboot
```

Após reiniciar, verifique se a VM consegue ver o dispositivo de áudio e os
comandos SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Instale ou atualize o OpenClaw na VM e então habilite o plugin incluído ali:

```bash
openclaw plugins enable google-meet
```

Inicie o host de nó na VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Se `<gateway-host>` for um IP de LAN e você não estiver usando TLS, o nó recusa o
WebSocket em texto claro a menos que você aceite explicitamente essa rede privada
confiável:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` é ambiente do processo, não uma
configuração de `openclaw.json`. `openclaw node install` a armazena no ambiente
do LaunchAgent quando ela está presente no comando de instalação.

Aprove o nó a partir do host do Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirme que o Gateway vê o nó e que ele anuncia tanto `googlemeet.chrome` quanto
a capacidade de navegador/`browser.proxy`:

```bash
openclaw nodes status
```

Encaminhe o Meet por esse nó no host do Gateway:

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

ou peça ao agente para usar a ferramenta `google_meet` com
`transport: "chrome-node"`.

Para um teste smoke de um comando que cria ou reutiliza uma sessão, fala uma
frase conhecida e imprime a integridade da sessão:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante a entrada em tempo real, a automação de navegador do OpenClaw preenche o
nome de convidado, clica em Entrar/Solicitar entrada e aceita a escolha de
primeira execução "Use microphone" do Meet quando esse prompt aparece. Durante
entrada somente observação ou criação de reunião somente pelo navegador, ela
continua pelo mesmo prompt sem microfone quando essa escolha está disponível. Se
o perfil do navegador não estiver conectado, o Meet estiver aguardando admissão
pelo anfitrião, o Chrome precisar de permissão de microfone/câmera para uma
entrada em tempo real ou o Meet estiver preso em um prompt que a automação não
conseguiu resolver, o resultado de join/test-speech informa
`manualActionRequired: true` com `manualActionReason` e `manualActionMessage`.
Os agentes devem parar de tentar novamente a entrada, relatar essa mensagem
exata mais o `browserUrl`/`browserTitle` atual, e tentar novamente somente depois
que a ação manual no navegador estiver concluída.

Se `chromeNode.node` for omitido, o OpenClaw seleciona automaticamente somente
quando exatamente um nó conectado anuncia tanto `googlemeet.chrome` quanto
controle de navegador. Se vários nós compatíveis estiverem conectados, defina
`chromeNode.node` como o ID do nó, nome de exibição ou IP remoto.

Verificações comuns de falha:

- `Configured Google Meet node ... is not usable: offline`: o Node fixado é
  conhecido pelo Gateway, mas está indisponível. Os agentes devem tratar esse
  Node como estado de diagnóstico, não como um host Chrome utilizável, e relatar
  o bloqueio de configuração em vez de recorrer a outro transporte, a menos que
  o usuário tenha pedido isso.
- `No connected Google Meet-capable node`: inicie `openclaw node run` na VM,
  aprove o pareamento e garanta que `openclaw plugins enable google-meet` e
  `openclaw plugins enable browser` tenham sido executados na VM. Confirme
  também que o host do Gateway permite ambos os comandos de Node com
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: instale `blackhole-2ch` no host que
  está sendo verificado e reinicie antes de usar áudio local do Chrome.
- `BlackHole 2ch audio device not found on the node`: instale `blackhole-2ch`
  na VM e reinicie a VM.
- O Chrome abre, mas não consegue entrar: faça login no perfil do navegador
  dentro da VM ou mantenha `chrome.guestName` definido para entrada como
  convidado. A entrada automática como convidado usa a automação de navegador do
  OpenClaw pelo proxy de navegador do Node; garanta que a configuração de
  navegador do Node aponte para o perfil desejado, por exemplo
  `browser.defaultProfile: "user"` ou um perfil de sessão existente nomeado.
- Abas duplicadas do Meet: mantenha `chrome.reuseExistingTab: true` habilitado.
  O OpenClaw ativa uma aba existente para a mesma URL do Meet antes de abrir uma
  nova, e a criação de reunião pelo navegador reutiliza uma aba em andamento de
  `https://meet.google.com/new` ou de solicitação de conta Google antes de abrir
  outra.
- Sem áudio: no Meet, roteie microfone/alto-falante pelo caminho do dispositivo
  de áudio virtual usado pelo OpenClaw; use dispositivos virtuais separados ou
  roteamento no estilo Loopback para áudio duplex limpo.

## Notas de instalação

O padrão em tempo real do Chrome usa duas ferramentas externas:

- `sox`: utilitário de áudio de linha de comando. O Plugin usa comandos
  explícitos de dispositivo CoreAudio para a ponte de áudio PCM16 padrão de
  24 kHz.
- `blackhole-2ch`: driver de áudio virtual do macOS. Ele cria o dispositivo de
  áudio `BlackHole 2ch` pelo qual o Chrome/Meet pode rotear.

O OpenClaw não inclui nem redistribui nenhum desses pacotes. A documentação pede
que os usuários os instalem como dependências do host pelo Homebrew. O SoX é
licenciado como `LGPL-2.0-only AND GPL-2.0-only`; o BlackHole é GPL-3.0. Se você
criar um instalador ou appliance que inclua o BlackHole com o OpenClaw, revise
os termos de licenciamento upstream do BlackHole ou obtenha uma licença separada
da Existential Audio.

## Transportes

### Chrome

O transporte Chrome abre a URL do Meet pelo controle de navegador do OpenClaw e
entra como o perfil de navegador OpenClaw autenticado. No macOS, o Plugin
verifica `BlackHole 2ch` antes da inicialização. Se configurado, ele também
executa um comando de integridade da ponte de áudio e um comando de inicialização
antes de abrir o Chrome. Use `chrome` quando Chrome/áudio estiverem no host do
Gateway; use `chrome-node` quando Chrome/áudio estiverem em um Node pareado,
como uma VM Parallels macOS. Para Chrome local, escolha o perfil com
`browser.defaultProfile`; `chrome.browserProfile` é passado para hosts
`chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Roteie o áudio do microfone e do alto-falante do Chrome pela ponte de áudio local
do OpenClaw. Se `BlackHole 2ch` não estiver instalado, a entrada falha com um
erro de configuração em vez de entrar silenciosamente sem um caminho de áudio.

### Twilio

O transporte Twilio é um plano de discagem estrito delegado ao Plugin Voice
Call. Ele não analisa páginas do Meet em busca de números de telefone.

Use isso quando a participação pelo Chrome não estiver disponível ou quando você
quiser um fallback de discagem telefônica. O Google Meet deve expor um número de
discagem telefônica e um PIN para a reunião; o OpenClaw não descobre esses dados
pela página do Meet.

Habilite o Plugin Voice Call no host do Gateway, não no Node do Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
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
        },
      },
    },
  },
}
```

Forneça credenciais da Twilio pelo ambiente ou pela configuração. O ambiente
mantém segredos fora de `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Reinicie ou recarregue o Gateway depois de habilitar `voice-call`; alterações de
configuração de Plugin não aparecem em um processo do Gateway já em execução até
que ele seja recarregado.

Depois verifique:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Quando a delegação da Twilio estiver conectada, `googlemeet setup` inclui
verificações bem-sucedidas de `twilio-voice-call-plugin`,
`twilio-voice-call-credentials` e `twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Use `--dtmf-sequence` quando a reunião exigir uma sequência personalizada:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth e preflight

OAuth é opcional para criar um link do Meet porque `googlemeet create` pode
recorrer à automação de navegador. Configure OAuth quando quiser criação pela
API oficial, resolução de espaços ou verificações de preflight da Meet Media API.

O acesso à API do Google Meet usa OAuth de usuário: crie um cliente OAuth no
Google Cloud, solicite os escopos necessários, autorize uma conta Google e então
armazene o token de atualização resultante na configuração do Plugin Google Meet
ou forneça as variáveis de ambiente `OPENCLAW_GOOGLE_MEET_*`.

OAuth não substitui o caminho de entrada pelo Chrome. Os transportes Chrome e
Chrome-node ainda entram por um perfil Chrome autenticado, BlackHole/SoX e um
Node conectado quando você usa participação pelo navegador. OAuth serve apenas
para o caminho oficial da API do Google Meet: criar espaços de reunião, resolver
espaços e executar verificações de preflight da Meet Media API.

### Criar credenciais do Google

No Google Cloud Console:

1. Crie ou selecione um projeto do Google Cloud.
2. Habilite a **Google Meet REST API** para esse projeto.
3. Configure a tela de consentimento OAuth.
   - **Internal** é mais simples para uma organização do Google Workspace.
   - **External** funciona para configurações pessoais/de teste; enquanto o app
     estiver em Testing, adicione cada conta Google que autorizará o app como
     usuário de teste.
4. Adicione os escopos solicitados pelo OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Crie um ID de cliente OAuth.
   - Tipo de aplicativo: **Web application**.
   - URI de redirecionamento autorizado:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Copie o ID do cliente e o segredo do cliente.

`meetings.space.created` é exigido por Google Meet `spaces.create`.
`meetings.space.readonly` permite que o OpenClaw resolva URLs/códigos do Meet em
espaços. `meetings.conference.media.readonly` é para preflight da Meet Media API
e trabalho de mídia; o Google pode exigir inscrição no Developer Preview para o
uso real da Media API. Se você só precisa de entradas pelo Chrome baseadas em
navegador, ignore OAuth por completo.

### Emitir o token de atualização

Configure `oauth.clientId` e, opcionalmente, `oauth.clientSecret`, ou passe-os
como variáveis de ambiente, e então execute:

```bash
openclaw googlemeet auth login --json
```

O comando imprime um bloco de configuração `oauth` com um token de atualização.
Ele usa PKCE, callback localhost em `http://localhost:8085/oauth2callback` e um
fluxo manual de copiar/colar com `--manual`.

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

Armazene o objeto `oauth` na configuração do Plugin Google Meet:

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

Prefira variáveis de ambiente quando não quiser o token de atualização na
configuração. Se valores de configuração e de ambiente estiverem presentes, o
Plugin resolve primeiro a configuração e depois usa o ambiente como fallback.

O consentimento OAuth inclui criação de espaço do Meet, acesso de leitura a
espaço do Meet e acesso de leitura à mídia de conferência do Meet. Se você se
autenticou antes de existir suporte à criação de reuniões, execute novamente
`openclaw googlemeet auth login --json` para que o token de atualização tenha o
escopo `meetings.space.created`.

### Verificar OAuth com doctor

Execute o doctor de OAuth quando quiser uma verificação de integridade rápida e
sem segredos:

```bash
openclaw googlemeet doctor --oauth --json
```

Isso não carrega o runtime do Chrome nem exige um Node do Chrome conectado. Ele
verifica se a configuração OAuth existe e se o token de atualização consegue
emitir um token de acesso. O relatório JSON inclui apenas campos de status como
`ok`, `configured`, `tokenSource`, `expiresAt` e mensagens de verificação; ele
não imprime o token de acesso, o token de atualização nem o segredo do cliente.

Resultados comuns:

| Verificação          | Significado                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` mais `oauth.refreshToken`, ou um token de acesso em cache, está presente. |
| `oauth-token`        | O token de acesso em cache ainda é válido, ou o token de atualização emitiu um novo token de acesso. |
| `meet-spaces-get`    | A verificação opcional `--meeting` resolveu um espaço do Meet existente.                |
| `meet-spaces-create` | A verificação opcional `--create-space` criou um novo espaço do Meet.                   |

Para comprovar também a habilitação da Google Meet API e o escopo
`spaces.create`, execute a verificação de criação com efeito colateral:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` cria uma URL descartável do Meet. Use isso quando precisar
confirmar que o projeto do Google Cloud tem a API do Meet habilitada e que a
conta autorizada tem o escopo `meetings.space.created`.

Para comprovar acesso de leitura a um espaço de reunião existente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` e `resolve-space` comprovam acesso de leitura a um
espaço existente que a conta Google autorizada consegue acessar. Um `403` nessas
verificações geralmente significa que a Google Meet REST API está desabilitada,
que o token de atualização consentido não tem o escopo necessário ou que a conta
Google não consegue acessar esse espaço do Meet. Um erro de token de atualização
significa executar novamente `openclaw googlemeet auth login --json` e armazenar
o novo bloco `oauth`.

Nenhuma credencial OAuth é necessária para o fallback de navegador. Nesse modo,
a autenticação do Google vem do perfil Chrome autenticado no Node selecionado,
não da configuração do OpenClaw.

Estas variáveis de ambiente são aceitas como fallbacks:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` ou `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ou `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ou
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` ou `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` ou `GOOGLE_MEET_PREVIEW_ACK`

Resolva uma URL do Meet, código ou `spaces/{id}` por meio de `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Execute a verificação prévia antes do trabalho de mídia:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Liste artefatos da reunião e presença depois que o Meet tiver criado registros de conferência:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Com `--meeting`, `artifacts` e `attendance` usam o registro de conferência mais recente
por padrão. Passe `--all-conference-records` quando quiser todos os registros retidos
para essa reunião.

A consulta ao Calendar pode resolver a URL da reunião pelo Google Calendar antes de ler
artefatos do Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` pesquisa o calendário `primary` de hoje em busca de um evento do Calendar com um
link do Google Meet. Use `--event <query>` para pesquisar texto de evento correspondente e
`--calendar <id>` para um calendário não primário. A consulta ao Calendar exige um novo
login OAuth que inclua o escopo somente leitura de eventos do Calendar.
`calendar-events` pré-visualiza os eventos do Meet correspondentes e marca o evento que
`latest`, `artifacts`, `attendance` ou `export` escolherá.

Se você já souber o id do registro de conferência, acesse-o diretamente:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

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

`artifacts` retorna metadados do registro de conferência mais metadados de recursos de
participante, gravação, transcrição, entrada de transcrição estruturada e notas inteligentes quando
o Google os expõe para a reunião. Use `--no-transcript-entries` para ignorar
a consulta de entradas em reuniões grandes. `attendance` expande participantes em
linhas de sessão de participante com horários de primeira/última visualização, duração total da sessão,
sinalizadores de atraso/saída antecipada e recursos de participantes duplicados mesclados por usuário
conectado ou nome de exibição. Passe `--no-merge-duplicates` para manter recursos brutos de participante
separados, `--late-after-minutes` para ajustar a detecção de atraso e
`--early-before-minutes` para ajustar a detecção de saída antecipada.

`export` grava uma pasta contendo `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` e `manifest.json`.
`manifest.json` registra a entrada escolhida, opções de exportação, registros de conferência,
arquivos de saída, contagens, origem do token, evento do Calendar quando usado e quaisquer
avisos de recuperação parcial. Passe `--zip` para também gravar um arquivo portátil ao lado
da pasta. Passe `--include-doc-bodies` para exportar o texto de Google Docs de transcrição vinculada e
notas inteligentes por meio de `files.export` do Google Drive; isso exige um
novo login OAuth que inclua o escopo somente leitura do Drive Meet. Sem
`--include-doc-bodies`, as exportações incluem apenas metadados do Meet e entradas de transcrição
estruturadas. Se o Google retornar uma falha parcial de artefato, como um erro de listagem de notas inteligentes,
entrada de transcrição ou corpo de documento do Drive, o resumo e o
manifesto mantêm o aviso em vez de falhar a exportação inteira.
Use `--dry-run` para buscar os mesmos dados de artefatos/presença e imprimir o
JSON do manifesto sem criar a pasta ou o ZIP. Isso é útil antes de gravar
uma exportação grande ou quando um agente precisa apenas de contagens, registros selecionados e
avisos.

Agentes também podem criar o mesmo pacote por meio da ferramenta `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Defina `"dryRun": true` para retornar apenas o manifesto de exportação e ignorar gravações de arquivos.

Execute o smoke ao vivo protegido contra uma reunião real retida:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Ambiente do smoke ao vivo:

- `OPENCLAW_LIVE_TEST=1` habilita testes ao vivo protegidos.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` aponta para uma URL do Meet retida, código ou
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID` fornece o id de cliente OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN` fornece
  o token de atualização.
- Opcional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` e
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` usam os mesmos nomes de fallback
  sem o prefixo `OPENCLAW_`.

O smoke ao vivo básico de artefatos/presença precisa de
`https://www.googleapis.com/auth/meetings.space.readonly` e
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. A consulta ao Calendar
precisa de `https://www.googleapis.com/auth/calendar.events.readonly`. A exportação do corpo de documento do Drive
precisa de
`https://www.googleapis.com/auth/drive.meet.readonly`.

Crie um novo espaço do Meet:

```bash
openclaw googlemeet create
```

O comando imprime o novo `meeting uri`, a origem e a sessão de entrada. Com credenciais OAuth,
ele usa a API oficial do Google Meet. Sem credenciais OAuth, ele
usa o perfil de navegador conectado do nó Chrome fixado como fallback. Agentes podem
usar a ferramenta `google_meet` com `action: "create"` para criar e entrar em uma única
etapa. Para criação apenas de URL, passe `"join": false`.

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
conseguir criar a URL, o método do Gateway retornará uma resposta com falha e a
ferramenta `google_meet` retornará detalhes estruturados em vez de uma string simples:

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
`manualActionMessage` mais o contexto de nó/aba do navegador e parar de abrir novas
abas do Meet até que o operador conclua a etapa no navegador.

Exemplo de saída JSON da criação pela API:

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

Criar um Meet entra por padrão. O transporte Chrome ou Chrome-node ainda
precisa de um perfil do Google Chrome conectado para entrar pelo navegador. Se o
perfil estiver desconectado, o OpenClaw relata `manualActionRequired: true` ou um
erro de fallback do navegador e pede ao operador para concluir o login do Google antes
de tentar novamente.

Defina `preview.enrollmentAcknowledged: true` somente depois de confirmar que seu projeto Cloud,
principal OAuth e participantes da reunião estão inscritos no Google
Workspace Developer Preview Program para APIs de mídia do Meet.

## Configuração

O caminho comum de tempo real do Chrome precisa apenas do Plugin habilitado, BlackHole, SoX
e uma chave de provedor de voz em tempo real de backend. OpenAI é o padrão; defina
`realtime.provider: "google"` para usar o Google Gemini Live:

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
- `defaultMode: "realtime"`
- `chromeNode.node`: id/nome/IP de nó opcional para `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nome usado na tela de convidado desconectado do Meet
- `chrome.autoJoin: true`: preenchimento de nome de convidado e clique em Join Now em melhor esforço
  por meio da automação de navegador do OpenClaw no `chrome-node`
- `chrome.reuseExistingTab: true`: ativar uma aba existente do Meet em vez de
  abrir duplicatas
- `chrome.waitForInCallMs: 20000`: aguardar a aba do Meet relatar que está em chamada
  antes que a introdução em tempo real seja acionada
- `chrome.audioFormat: "pcm16-24khz"`: formato de áudio do par de comandos. Use
  `"g711-ulaw-8khz"` apenas para pares de comandos legados/personalizados que ainda emitem
  áudio de telefonia.
- `chrome.audioInputCommand`: comando SoX lendo do CoreAudio `BlackHole 2ch`
  e gravando áudio em `chrome.audioFormat`
- `chrome.audioOutputCommand`: comando SoX lendo áudio em `chrome.audioFormat`
  e gravando no CoreAudio `BlackHole 2ch`
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: respostas faladas breves, com
  `openclaw_agent_consult` para respostas mais aprofundadas
- `realtime.introMessage`: verificação curta de prontidão falada quando a ponte em tempo real
  conecta; defina como `""` para entrar silenciosamente
- `realtime.agentId`: id opcional de agente do OpenClaw para
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
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Configuração apenas de Twilio:

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

`voiceCall.enabled` tem como padrão `true`; com transporte Twilio, ele delega a
chamada PSTN real e o DTMF ao Plugin Voice Call. Se `voice-call` não estiver
habilitado, o Google Meet ainda pode validar e registrar o plano de discagem, mas não pode
fazer a chamada Twilio.

## Ferramenta

Agentes podem usar a ferramenta `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Use `transport: "chrome"` quando o Chrome é executado no host do Gateway. Use
`transport: "chrome-node"` quando o Chrome é executado em um node pareado, como uma VM
Parallels. Em ambos os casos, o modelo realtime e `openclaw_agent_consult` são executados no
host do Gateway, então as credenciais do modelo permanecem lá.

Use `action: "status"` para listar sessões ativas ou inspecionar um ID de sessão. Use
`action: "speak"` com `sessionId` e `message` para fazer o agente realtime
falar imediatamente. Use `action: "test_speech"` para criar ou reutilizar a sessão,
acionar uma frase conhecida e retornar a integridade `inCall` quando o host Chrome puder
relatá-la. `test_speech` sempre força `mode: "realtime"` e falha se for solicitado a
executar em `mode: "transcribe"` porque sessões somente de observação intencionalmente não podem
emitir fala. O resultado `speechOutputVerified` é baseado no aumento de bytes de saída de áudio
realtime durante esta chamada de teste, então uma sessão reutilizada com áudio anterior
não conta como uma nova verificação de fala bem-sucedida. Use `action: "leave"` para marcar
uma sessão como encerrada.

`status` inclui a integridade do Chrome quando disponível:

- `inCall`: o Chrome parece estar dentro da chamada do Meet
- `micMuted`: estado do microfone do Meet em melhor esforço
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: o
  perfil do navegador precisa de login manual, admissão pelo host do Meet, permissões ou
  reparo do controle do navegador antes que a fala possa funcionar
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: se
  a fala gerenciada do Chrome está permitida agora. `speechReady: false` significa que o OpenClaw não
  enviou a frase de introdução/teste para a ponte de áudio.
- `providerConnected` / `realtimeReady`: estado da ponte de voz realtime
- `lastInputAt` / `lastOutputAt`: último áudio visto vindo da ponte ou enviado para ela

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Consulta do agente realtime

O modo realtime do Chrome é otimizado para um loop de voz ao vivo. O provedor de voz realtime
ouve o áudio da reunião e fala pela ponte de áudio configurada.
Quando o modelo realtime precisa de raciocínio mais profundo, informações atuais ou ferramentas normais do
OpenClaw, ele pode chamar `openclaw_agent_consult`.

A ferramenta de consulta executa o agente OpenClaw regular nos bastidores com contexto recente da
transcrição da reunião e retorna uma resposta falada concisa para a sessão de voz realtime.
O modelo de voz pode então falar essa resposta de volta na reunião.
Ela usa a mesma ferramenta compartilhada de consulta realtime que Voice Call.

Por padrão, as consultas são executadas no agente `main`. Defina `realtime.agentId` quando uma
trilha do Meet deve consultar um workspace de agente OpenClaw dedicado, padrões de modelo,
política de ferramentas, memória e histórico de sessão.

`realtime.toolPolicy` controla a execução da consulta:

- `safe-read-only`: expõe a ferramenta de consulta e limita o agente regular a
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e
  `memory_get`.
- `owner`: expõe a ferramenta de consulta e permite que o agente regular use a política normal de
  ferramentas do agente.
- `none`: não expõe a ferramenta de consulta ao modelo de voz realtime.

A chave de sessão da consulta tem escopo por sessão do Meet, então chamadas de consulta de acompanhamento
podem reutilizar o contexto de consulta anterior durante a mesma reunião.

Para forçar uma verificação de prontidão falada depois que o Chrome entrou completamente na chamada:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Para o smoke completo de entrar e falar:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Checklist de teste ao vivo

Use esta sequência antes de entregar uma reunião a um agente desacompanhado:

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
  transporte padrão ou um node está fixado.
- `nodes status` mostra o node selecionado conectado.
- O node selecionado anuncia tanto `googlemeet.chrome` quanto `browser.proxy`.
- A aba do Meet entra na chamada e `test-speech` retorna integridade do Chrome com
  `inCall: true`.

Para um host Chrome remoto, como uma VM macOS Parallels, esta é a verificação segura
mais curta após atualizar o Gateway ou a VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Isso prova que o Plugin do Gateway está carregado, que o node da VM está conectado com o
token atual e que a ponte de áudio do Meet está disponível antes que um agente abra uma
aba de reunião real.

Para um smoke do Twilio, use uma reunião que exponha detalhes de discagem por telefone:

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
- `googlemeet leave <sessionId>` desliga a chamada de voz delegada.

## Solução de problemas

### O agente não consegue ver a ferramenta do Google Meet

Confirme que o Plugin está habilitado na configuração do Gateway e recarregue o Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Se você acabou de editar `plugins.entries.google-meet`, reinicie ou recarregue o Gateway.
O agente em execução só vê ferramentas de Plugin registradas pelo processo atual do Gateway.

### Nenhum node compatível com Google Meet conectado

No host do node, execute:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

No host do Gateway, aprove o node e verifique os comandos:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

O node deve estar conectado e listar `googlemeet.chrome` mais `browser.proxy`.
A configuração do Gateway deve permitir esses comandos de node:

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
`gateway token mismatch`, reinstale ou reinicie o node com o token atual do Gateway.
Para um Gateway em LAN, isso geralmente significa:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Depois recarregue o serviço do node e execute novamente:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### O navegador abre, mas o agente não consegue entrar

Execute `googlemeet test-speech` e inspecione a integridade do Chrome retornada. Se ela
relatar `manualActionRequired: true`, mostre `manualActionMessage` ao operador
e pare de tentar novamente até que a ação no navegador esteja concluída.

Ações manuais comuns:

- Faça login no perfil do Chrome.
- Admita o convidado pela conta host do Meet.
- Conceda permissões de microfone/câmera ao Chrome quando o prompt de permissão nativo do Chrome
  aparecer.
- Feche ou repare uma caixa de diálogo de permissão do Meet travada.

Não relate "não conectado" só porque o Meet mostra "Do you want people to
hear you in the meeting?" Esse é o intersticial de escolha de áudio do Meet; o OpenClaw
clica em **Use microphone** por automação do navegador quando disponível e continua
aguardando o estado real da reunião. Para fallback de navegador somente de criação, o OpenClaw
pode clicar em **Continue without microphone** porque criar a URL não precisa
do caminho de áudio realtime.

### A criação da reunião falha

`googlemeet create` primeiro usa o endpoint `spaces.create` da API do Google Meet
quando credenciais OAuth estão configuradas. Sem credenciais OAuth, ele faz fallback
para o navegador do node Chrome fixado. Confirme:

- Para criação via API: `oauth.clientId` e `oauth.refreshToken` estão configurados,
  ou variáveis de ambiente `OPENCLAW_GOOGLE_MEET_*` correspondentes estão presentes.
- Para criação via API: o token de atualização foi emitido depois que o suporte a criação foi
  adicionado. Tokens mais antigos podem não ter o escopo `meetings.space.created`; execute novamente
  `openclaw googlemeet auth login --json` e atualize a configuração do Plugin.
- Para fallback de navegador: `defaultTransport: "chrome-node"` e
  `chromeNode.node` apontam para um node conectado com `browser.proxy` e
  `googlemeet.chrome`.
- Para fallback de navegador: o perfil Chrome do OpenClaw nesse node está conectado
  ao Google e consegue abrir `https://meet.google.com/new`.
- Para fallback de navegador: novas tentativas reutilizam uma aba existente de `https://meet.google.com/new`
  ou de prompt de conta Google antes de abrir uma nova aba. Se um agente expirar,
  tente novamente a chamada da ferramenta em vez de abrir manualmente outra aba do Meet.
- Para fallback de navegador: se a ferramenta retornar `manualActionRequired: true`, use
  os valores retornados `browser.nodeId`, `browser.targetId`, `browserUrl` e
  `manualActionMessage` para orientar o operador. Não tente novamente em loop até que essa
  ação esteja concluída.
- Para fallback de navegador: se o Meet mostrar "Do you want people to hear you in the
  meeting?", deixe a aba aberta. O OpenClaw deve clicar em **Use microphone** ou, para
  fallback somente de criação, **Continue without microphone** por automação do navegador
  e continuar aguardando a URL do Meet gerada. Se não conseguir, o
  erro deve mencionar `meet-audio-choice-required`, não `google-login-required`.

### O agente entra, mas não fala

Verifique o caminho realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Use `mode: "realtime"` para escutar/responder por voz. `mode: "transcribe"` intencionalmente
não inicia a ponte de voz realtime duplex. `googlemeet test-speech`
sempre verifica o caminho realtime e relata se bytes de saída da ponte foram
observados para essa invocação. Se `speechOutputVerified` for falso e
`speechOutputTimedOut` for verdadeiro, o provedor realtime pode ter aceitado a
fala, mas o OpenClaw não viu novos bytes de saída chegarem à ponte de áudio do Chrome.

Verifique também:

- Uma chave de provedor realtime está disponível no host do Gateway, como
  `OPENAI_API_KEY` ou `GEMINI_API_KEY`.
- `BlackHole 2ch` está visível no host Chrome.
- `sox` existe no host Chrome.
- O microfone e o alto-falante do Meet estão roteados pelo caminho de áudio virtual usado pelo
  OpenClaw.

`googlemeet doctor [session-id]` imprime a sessão, o node, o estado na chamada,
o motivo da ação manual, a conexão do provedor realtime, `realtimeReady`, atividade de
entrada/saída de áudio, últimos timestamps de áudio, contadores de bytes e URL do navegador.
Use `googlemeet status [session-id] --json` quando precisar do JSON bruto. Use
`googlemeet doctor --oauth` quando precisar verificar a atualização OAuth do Google Meet
sem expor tokens; adicione `--meeting` ou `--create-space` quando também precisar de uma
prova da API do Google Meet.

Se um agente expirou e você consegue ver uma aba do Meet já aberta, inspecione essa aba
sem abrir outra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

A ação de ferramenta equivalente é `recover_current_tab`. Ela foca e inspeciona uma
aba existente do Meet para o transporte selecionado. Com `chrome`, ela usa controle de
navegador local por meio do Gateway; com `chrome-node`, usa o node Chrome configurado.
Ela não abre uma nova aba nem cria uma nova sessão; ela relata o
bloqueador atual, como login, admissão, permissões ou estado de escolha de áudio.
O comando da CLI conversa com o Gateway configurado, então o Gateway deve estar em execução;
`chrome-node` também exige que o node Chrome esteja conectado.

### As verificações de configuração do Twilio falham

`twilio-voice-call-plugin` falha quando `voice-call` não está permitido ou não está habilitado.
Adicione-o a `plugins.allow`, habilite `plugins.entries.voice-call` e recarregue o
Gateway.

`twilio-voice-call-credentials` falha quando o backend do Twilio não tem account
SID, token de autenticação ou número de origem. Defina-os no host do Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` falha quando `voice-call` não tem exposição pública de webhook,
ou quando `publicUrl` aponta para local loopback ou espaço de rede privada.
Defina `plugins.entries.voice-call.config.publicUrl` como a URL pública do provedor ou
configure uma exposição de túnel/Tailscale para `voice-call`.

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

Para desenvolvimento local, use um túnel ou uma exposição Tailscale em vez de uma URL de
host privada:

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

Depois reinicie ou recarregue o Gateway e execute:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` é apenas uma verificação de prontidão por padrão. Para fazer um teste dry-run com um número específico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Adicione `--yes` somente quando você quiser intencionalmente fazer uma chamada
de notificação de saída ao vivo:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### A chamada Twilio começa, mas nunca entra na reunião

Confirme que o evento do Meet expõe detalhes de discagem por telefone. Passe o número de
discagem e o PIN exatos ou uma sequência DTMF personalizada:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Use `w` inicial ou vírgulas em `--dtmf-sequence` se o provedor precisar de uma pausa
antes de inserir o PIN.

Se a chamada telefônica for criada, mas a lista de participantes do Meet nunca mostrar o
participante por discagem:

- Execute `openclaw voicecall status --call-id <id>` e confirme que a chamada ainda está
  ativa.
- Execute `openclaw voicecall tail` e verifique se os webhooks do Twilio estão chegando ao
  Gateway.
- Execute novamente `openclaw googlemeet setup --transport twilio`; uma verificação de configuração verde é
  obrigatória, mas não prova que a sequência do PIN da reunião está correta.
- Confirme que o número de discagem pertence ao mesmo convite do Meet e à mesma região do
  PIN.
- Aumente as pausas iniciais em `--dtmf-sequence` se o Meet demorar para atender, por
  exemplo `wwww123456#`.

Se os webhooks não chegarem, depure primeiro o Plugin Voice Call: o provedor deve
alcançar `plugins.entries.voice-call.config.publicUrl` ou o túnel configurado.
Consulte [Solução de problemas de chamada de voz](/pt-BR/plugins/voice-call#troubleshooting).

## Observações

A API de mídia oficial do Google Meet é orientada ao recebimento, portanto falar em uma chamada do Meet
ainda precisa de um caminho de participante. Este plugin mantém esse limite visível:
o Chrome cuida da participação pelo navegador e do roteamento de áudio local; o Twilio cuida
da participação por discagem telefônica.

O modo em tempo real do Chrome precisa de `BlackHole 2ch` mais uma das seguintes opções:

- `chrome.audioInputCommand` mais `chrome.audioOutputCommand`: o OpenClaw controla a
  ponte do modelo em tempo real e direciona o áudio em `chrome.audioFormat` entre esses
  comandos e o provedor de voz em tempo real selecionado. O caminho padrão do Chrome é
  PCM16 de 24 kHz; G.711 mu-law de 8 kHz permanece disponível para pares de comandos legados.
- `chrome.audioBridgeCommand`: um comando de ponte externo controla todo o caminho de
  áudio local e deve sair depois de iniciar ou validar seu daemon.

Para áudio duplex limpo, roteie a saída do Meet e o microfone do Meet por dispositivos
virtuais separados ou por um grafo de dispositivos virtuais no estilo Loopback. Um único
dispositivo BlackHole compartilhado pode ecoar outros participantes de volta para a chamada.

`googlemeet speak` aciona a ponte de áudio em tempo real ativa para uma sessão do Chrome. `googlemeet leave` interrompe essa ponte. Para sessões Twilio delegadas
por meio do Plugin Voice Call, `leave` também encerra a chamada de voz subjacente.

## Relacionados

- [Plugin de chamada de voz](/pt-BR/plugins/voice-call)
- [Modo de fala](/pt-BR/nodes/talk)
- [Criando plugins](/pt-BR/plugins/building-plugins)
