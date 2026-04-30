---
read_when:
    - Você quer que um agente OpenClaw participe de uma chamada do Google Meet
    - Você quer que um agente do OpenClaw crie uma nova chamada no Google Meet
    - Você está configurando o Chrome, o nó do Chrome ou o Twilio como transporte do Google Meet
summary: 'Plugin do Google Meet: entrar em URLs explícitas do Meet pelo Chrome ou Twilio com padrões de voz em tempo real'
title: Plugin do Google Meet
x-i18n:
    generated_at: "2026-04-30T09:59:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b989c872fee0dca31680f67559cd26b715303f7c6f4eeda51fc63889bb0383c
    source_path: plugins/google-meet.md
    workflow: 16
---

Suporte a participantes do Google Meet para OpenClaw — o Plugin é explícito por design:

- Ele entra apenas em uma URL explícita `https://meet.google.com/...`.
- Ele pode criar um novo espaço do Meet pela API do Google Meet e, então, entrar na
  URL retornada.
- Voz `realtime` é o modo padrão.
- A voz em tempo real pode chamar de volta o agente OpenClaw completo quando raciocínio
  mais profundo ou ferramentas forem necessários.
- Agentes escolhem o comportamento de entrada com `mode`: use `realtime` para ouvir
  e responder ao vivo, ou `transcribe` para entrar/controlar o navegador sem a ponte
  de voz em tempo real.
- A autenticação começa como OAuth pessoal do Google ou um perfil do Chrome já conectado.
- Não há anúncio automático de consentimento.
- O backend de áudio padrão do Chrome é `BlackHole 2ch`.
- O Chrome pode rodar localmente ou em um host node pareado.
- O Twilio aceita um número de discagem mais PIN opcional ou sequência DTMF.
- O comando CLI é `googlemeet`; `meet` é reservado para fluxos de teleconferência
  mais amplos de agentes.

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
instalador do Homebrew exige uma reinicialização antes que o macOS exponha o dispositivo:

```bash
sudo reboot
```

Após reiniciar, verifique os dois componentes:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Habilite o Plugin:

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

A saída da configuração foi feita para ser legível por agentes e ciente do modo. Ela informa o perfil do Chrome,
a fixação de node e, para entradas via Chrome em tempo real, a ponte de áudio
BlackHole/SoX e as verificações de introdução em tempo real atrasada. Para entradas somente de observação, verifique o mesmo
transporte com `--mode transcribe`; esse modo pula os pré-requisitos de áudio em tempo real
porque não escuta nem fala pela ponte:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Quando a delegação do Twilio estiver configurada, a configuração também informa se o
Plugin `voice-call` e as credenciais do Twilio estão prontos. Trate qualquer verificação
`ok: false` como um bloqueador para o transporte e o modo verificados antes de pedir que um agente
entre. Use `openclaw googlemeet setup --json` para scripts ou saída legível por máquina. Use `--transport chrome`, `--transport chrome-node` ou `--transport twilio`
para pré-verificar um transporte específico antes que um agente tente usá-lo.

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

- Criação via API: usada quando as credenciais OAuth do Google Meet estão configuradas. Este é
  o caminho mais determinístico e não depende do estado da interface do navegador.
- Fallback do navegador: usado quando credenciais OAuth estão ausentes. O OpenClaw usa o
  node Chrome fixado, abre `https://meet.google.com/new`, espera o Google
  redirecionar para uma URL real com código de reunião e, então, retorna essa URL. Esse caminho exige
  que o perfil do Chrome do OpenClaw no node já esteja conectado ao Google.
  A automação do navegador lida com o próprio prompt de microfone de primeira execução do Meet; esse prompt
  não é tratado como uma falha de login do Google.
  Os fluxos de entrada e criação também tentam reutilizar uma aba existente do Meet antes de abrir uma
  nova. A correspondência ignora strings de consulta de URL inofensivas, como `authuser`, então uma
  nova tentativa do agente deve focar a reunião já aberta em vez de criar uma segunda
  aba do Chrome.

A saída do comando/ferramenta inclui um campo `source` (`api` ou `browser`) para que agentes
possam explicar qual caminho foi usado. `create` entra na nova reunião por padrão e
retorna `joined: true` mais a sessão de entrada. Para apenas emitir a URL, use
`create --no-join` na CLI ou passe `"join": false` para a ferramenta.

Ou diga a um agente: "Crie um Google Meet, entre nele com voz em tempo real e me envie
o link." O agente deve chamar `google_meet` com `action: "create"` e
então compartilhar o `meetingUri` retornado.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Para uma entrada somente de observação/controle do navegador, defina `"mode": "transcribe"`. Isso
não inicia a ponte duplex do modelo em tempo real, não exige BlackHole ou SoX
e não responderá falando na reunião. Entradas pelo Chrome nesse modo também evitam
a concessão de permissão de microfone/câmera do OpenClaw e evitam o caminho **Usar
microfone** do Meet. Se o Meet mostrar uma tela intermediária de escolha de áudio, a automação tenta
o caminho sem microfone e, caso contrário, informa uma ação manual em vez de abrir
o microfone local.

Durante sessões em tempo real, o status de `google_meet` inclui a integridade do navegador e da ponte de áudio,
como `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, últimos carimbos de data/hora de entrada/saída,
contadores de bytes e estado fechado da ponte. Se um prompt seguro da página do Meet
aparecer, a automação do navegador lida com ele quando consegue. Login, admissão pelo anfitrião e
prompts de permissão do navegador/SO são informados como ação manual com um motivo e
mensagem para o agente retransmitir. Sessões gerenciadas do Chrome só emitem a introdução ou
frase de teste depois que a integridade do navegador informa `inCall: true`; caso contrário, o status informa
`speechReady: false` e a tentativa de fala é bloqueada em vez de fingir que o
agente falou na reunião.

Entradas pelo Chrome local usam o perfil de navegador conectado do OpenClaw. O modo em tempo real
exige `BlackHole 2ch` para o caminho de microfone/alto-falante usado pelo OpenClaw. Para
áudio duplex limpo, use dispositivos virtuais separados ou um grafo no estilo Loopback; um
único dispositivo BlackHole é suficiente para um primeiro teste de fumaça, mas pode gerar eco.

### Gateway local + Chrome do Parallels

Você **não** precisa de um Gateway OpenClaw completo nem de uma chave de API de modelo dentro de uma VM macOS
apenas para fazer a VM possuir o Chrome. Rode o Gateway e o agente localmente e, então, rode um
host node na VM. Habilite o Plugin integrado na VM uma vez para que o node
anuncie o comando do Chrome:

O que roda onde:

- Host do Gateway: OpenClaw Gateway, workspace do agente, chaves de modelo/API, provedor em tempo real
  e a configuração do Plugin Google Meet.
- VM macOS do Parallels: OpenClaw CLI/host node, Google Chrome, SoX, BlackHole 2ch
  e um perfil do Chrome conectado ao Google.
- Não necessário na VM: serviço Gateway, configuração de agente, chave OpenAI/GPT ou configuração de
  provedor de modelo.

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

Instale ou atualize o OpenClaw na VM e, então, habilite o Plugin integrado nela:

```bash
openclaw plugins enable google-meet
```

Inicie o host node na VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Se `<gateway-host>` for um IP de LAN e você não estiver usando TLS, o node recusará o
WebSocket em texto puro a menos que você opte por isso para essa rede privada confiável:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Use a mesma variável de ambiente ao instalar o node como um LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` é ambiente de processo, não uma configuração de
`openclaw.json`. `openclaw node install` a armazena no ambiente do LaunchAgent
quando ela está presente no comando de instalação.

Aprove o node a partir do host do Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirme que o Gateway vê o node e que ele anuncia tanto `googlemeet.chrome`
quanto a capacidade do navegador/`browser.proxy`:

```bash
openclaw nodes status
```

Roteie o Meet por esse node no host do Gateway:

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

Para um teste de fumaça de um comando que cria ou reutiliza uma sessão, fala uma frase
conhecida e imprime a integridade da sessão:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante a entrada em tempo real, a automação de navegador do OpenClaw preenche o nome de convidado, clica em
Entrar/Pedir para entrar e aceita a escolha "Usar microfone" de primeira execução do Meet quando esse
prompt aparece. Durante entrada somente de observação ou criação de reunião somente pelo navegador, ela
continua além do mesmo prompt sem microfone quando essa escolha está disponível.
Se o perfil do navegador não estiver conectado, o Meet estiver aguardando admissão do anfitrião,
o Chrome precisar de permissão de microfone/câmera para uma entrada em tempo real, ou o Meet estiver preso
em um prompt que a automação não conseguiu resolver, o resultado de entrada/test-speech informa
`manualActionRequired: true` com `manualActionReason` e
`manualActionMessage`. Agentes devem parar de tentar entrar novamente, relatar essa
mensagem exata mais o `browserUrl`/`browserTitle` atual e tentar novamente apenas depois que a
ação manual no navegador estiver concluída.

Se `chromeNode.node` for omitido, o OpenClaw seleciona automaticamente apenas quando exatamente um
node conectado anuncia tanto `googlemeet.chrome` quanto controle do navegador. Se
vários nodes capazes estiverem conectados, defina `chromeNode.node` como o id do node,
nome de exibição ou IP remoto.

Verificações comuns de falha:

- `Configured Google Meet node ... is not usable: offline`: o nó fixado é
  conhecido pelo Gateway, mas está indisponível. Os agentes devem tratar esse nó
  como estado de diagnóstico, não como um host Chrome utilizável, e relatar o
  bloqueador de configuração em vez de recorrer a outro transporte, a menos que
  o usuário tenha pedido isso.
- `No connected Google Meet-capable node`: inicie `openclaw node run` na VM,
  aprove o pareamento e confirme que `openclaw plugins enable google-meet` e
  `openclaw plugins enable browser` foram executados na VM. Confirme também que
  o host do Gateway permite ambos os comandos de nó com
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: instale `blackhole-2ch` no host que
  está sendo verificado e reinicie antes de usar áudio local do Chrome.
- `BlackHole 2ch audio device not found on the node`: instale `blackhole-2ch`
  na VM e reinicie a VM.
- O Chrome abre, mas não consegue entrar: faça login no perfil do navegador dentro
  da VM, ou mantenha `chrome.guestName` definido para entrada como convidado. A
  entrada automática como convidado usa a automação de navegador do OpenClaw por
  meio do proxy de navegador do nó; confirme que a configuração de navegador do
  nó aponta para o perfil desejado, por exemplo
  `browser.defaultProfile: "user"` ou um perfil de sessão existente nomeado.
- Abas duplicadas do Meet: mantenha `chrome.reuseExistingTab: true` ativado. O
  OpenClaw ativa uma aba existente para a mesma URL do Meet antes de abrir uma
  nova, e a criação de reunião pelo navegador reutiliza uma aba em andamento de
  `https://meet.google.com/new` ou de solicitação de conta Google antes de abrir
  outra.
- Sem áudio: no Meet, direcione o microfone/alto-falante pelo caminho de
  dispositivo de áudio virtual usado pelo OpenClaw; use dispositivos virtuais
  separados ou roteamento estilo Loopback para áudio duplex limpo.

## Notas de instalação

O padrão em tempo real do Chrome usa duas ferramentas externas:

- `sox`: utilitário de áudio de linha de comando. O plugin usa comandos
  explícitos de dispositivo CoreAudio para a ponte de áudio PCM16 padrão de
  24 kHz.
- `blackhole-2ch`: driver de áudio virtual do macOS. Ele cria o dispositivo de
  áudio `BlackHole 2ch` pelo qual o Chrome/Meet pode rotear.

O OpenClaw não empacota nem redistribui nenhum dos pacotes. A documentação pede
que os usuários os instalem como dependências do host via Homebrew. SoX é
licenciado como `LGPL-2.0-only AND GPL-2.0-only`; BlackHole é GPL-3.0. Se você
criar um instalador ou appliance que empacote BlackHole com OpenClaw, revise os
termos de licenciamento upstream do BlackHole ou obtenha uma licença separada da
Existential Audio.

## Transportes

### Chrome

O transporte Chrome abre a URL do Meet por meio do controle de navegador do
OpenClaw e entra como o perfil de navegador OpenClaw autenticado. No macOS, o
plugin verifica `BlackHole 2ch` antes de iniciar. Se configurado, ele também
executa um comando de integridade da ponte de áudio e um comando de inicialização
antes de abrir o Chrome. Use `chrome` quando Chrome/áudio estiverem no host do
Gateway; use `chrome-node` quando Chrome/áudio estiverem em um nó pareado, como
uma VM macOS do Parallels. Para Chrome local, escolha o perfil com
`browser.defaultProfile`; `chrome.browserProfile` é passado para hosts
`chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Direcione o áudio do microfone e do alto-falante do Chrome pela ponte de áudio
local do OpenClaw. Se `BlackHole 2ch` não estiver instalado, a entrada falha com
um erro de configuração em vez de entrar silenciosamente sem um caminho de áudio.

### Twilio

O transporte Twilio é um plano de discagem estrito delegado ao plugin Voice
Call. Ele não analisa páginas do Meet em busca de números de telefone.

Use isto quando a participação pelo Chrome não estiver disponível ou quando você
quiser um fallback de discagem telefônica. O Google Meet deve expor um número de
discagem telefônica e PIN para a reunião; o OpenClaw não descobre esses dados a
partir da página do Meet.

Ative o plugin Voice Call no host do Gateway, não no nó Chrome:

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

Forneça credenciais do Twilio por ambiente ou configuração. O ambiente mantém
segredos fora de `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Reinicie ou recarregue o Gateway após ativar `voice-call`; alterações de
configuração de plugin não aparecem em um processo do Gateway já em execução até
que ele seja recarregado.

Então verifique:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Quando a delegação Twilio está conectada, `googlemeet setup` inclui verificações
bem-sucedidas de `twilio-voice-call-plugin` e
`twilio-voice-call-credentials`.

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

## OAuth e pré-verificação

OAuth é opcional para criar um link do Meet porque `googlemeet create` pode
recorrer à automação de navegador. Configure OAuth quando quiser criação pela
API oficial, resolução de espaços ou verificações de pré-verificação da Meet
Media API.

O acesso à Google Meet API usa OAuth de usuário: crie um cliente OAuth do Google
Cloud, solicite os escopos necessários, autorize uma conta Google e então armazene
o refresh token resultante na configuração do plugin Google Meet ou forneça as
variáveis de ambiente `OPENCLAW_GOOGLE_MEET_*`.

OAuth não substitui o caminho de entrada pelo Chrome. Os transportes Chrome e
Chrome-node ainda entram por meio de um perfil Chrome autenticado,
BlackHole/SoX e um nó conectado quando você usa participação pelo navegador.
OAuth serve apenas para o caminho oficial da Google Meet API: criar espaços de
reunião, resolver espaços e executar verificações de pré-verificação da Meet
Media API.

### Criar credenciais do Google

No Google Cloud Console:

1. Crie ou selecione um projeto do Google Cloud.
2. Ative a **Google Meet REST API** para esse projeto.
3. Configure a tela de consentimento OAuth.
   - **Internal** é o mais simples para uma organização do Google Workspace.
   - **External** funciona para configurações pessoais/de teste; enquanto o app
     estiver em Testing, adicione como usuário de teste cada conta Google que
     autorizará o app.
4. Adicione os escopos solicitados pelo OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Crie um ID de cliente OAuth.
   - Tipo de aplicação: **Web application**.
   - URI de redirecionamento autorizado:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Copie o ID do cliente e o segredo do cliente.

`meetings.space.created` é exigido por Google Meet `spaces.create`.
`meetings.space.readonly` permite que o OpenClaw resolva URLs/códigos do Meet em
espaços. `meetings.conference.media.readonly` é para pré-verificação e trabalho
de mídia da Meet Media API; o Google pode exigir inscrição no Developer Preview
para uso real da Media API. Se você precisa apenas de entradas pelo Chrome com
base no navegador, ignore OAuth totalmente.

### Emitir o refresh token

Configure `oauth.clientId` e, opcionalmente, `oauth.clientSecret`, ou passe-os
como variáveis de ambiente, então execute:

```bash
openclaw googlemeet auth login --json
```

O comando imprime um bloco de configuração `oauth` com um refresh token. Ele usa
PKCE, callback localhost em `http://localhost:8085/oauth2callback` e um fluxo
manual de copiar/colar com `--manual`.

Exemplos:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Use o modo manual quando o navegador não puder acessar o callback local:

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

Prefira variáveis de ambiente quando não quiser o refresh token na configuração.
Se valores de configuração e de ambiente estiverem presentes, o plugin resolve
primeiro a configuração e depois o fallback de ambiente.

O consentimento OAuth inclui criação de espaço do Meet, acesso de leitura a
espaço do Meet e acesso de leitura a mídia de conferência do Meet. Se você se
autenticou antes de existir suporte à criação de reuniões, execute novamente
`openclaw googlemeet auth login --json` para que o refresh token tenha o escopo
`meetings.space.created`.

### Verificar OAuth com doctor

Execute o doctor de OAuth quando quiser uma verificação de integridade rápida e
sem segredos:

```bash
openclaw googlemeet doctor --oauth --json
```

Isso não carrega o runtime do Chrome nem exige um nó Chrome conectado. Ele
verifica se a configuração OAuth existe e se o refresh token consegue emitir um
access token. O relatório JSON inclui apenas campos de status como `ok`,
`configured`, `tokenSource`, `expiresAt` e mensagens de verificação; ele não
imprime o access token, o refresh token nem o segredo do cliente.

Resultados comuns:

| Verificação          | Significado                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` mais `oauth.refreshToken`, ou um access token em cache, está presente. |
| `oauth-token`        | O access token em cache ainda é válido, ou o refresh token emitiu um novo access token. |
| `meet-spaces-get`    | A verificação opcional `--meeting` resolveu um espaço do Meet existente.               |
| `meet-spaces-create` | A verificação opcional `--create-space` criou um novo espaço do Meet.                  |

Para provar também a ativação da Google Meet API e o escopo `spaces.create`,
execute a verificação de criação com efeito colateral:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` cria uma URL descartável do Meet. Use quando precisar confirmar
que o projeto do Google Cloud tem a Meet API ativada e que a conta autorizada tem
o escopo `meetings.space.created`.

Para provar acesso de leitura a um espaço de reunião existente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` e `resolve-space` provam acesso de leitura a um espaço
existente que a conta Google autorizada consegue acessar. Um `403` dessas
verificações geralmente significa que a Google Meet REST API está desativada, que
o refresh token consentido não tem o escopo necessário, ou que a conta Google não
consegue acessar esse espaço do Meet. Um erro de refresh-token significa executar
novamente `openclaw googlemeet auth login --json` e armazenar o novo bloco
`oauth`.

Nenhuma credencial OAuth é necessária para o fallback de navegador. Nesse modo, a
autenticação Google vem do perfil Chrome autenticado no nó selecionado, não da
configuração do OpenClaw.

Estas variáveis de ambiente são aceitas como fallbacks:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` ou `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ou `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ou
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` ou `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` ou `GOOGLE_MEET_PREVIEW_ACK`

Resolva uma URL, um código ou `spaces/{id}` do Meet por meio de `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Execute o preflight antes do trabalho de mídia:

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
os artefatos do Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` pesquisa o calendário `primary` de hoje por um evento do Calendar com um
link do Google Meet. Use `--event <query>` para pesquisar texto de evento correspondente e
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
participantes, gravações, transcrições, entradas de transcrição estruturadas e notas
inteligentes quando o Google os expõe para a reunião. Use `--no-transcript-entries` para pular
a consulta de entradas em reuniões grandes. `attendance` expande participantes em
linhas de sessão de participante com horários da primeira/última visualização, duração total da sessão,
sinalizadores de atraso/saída antecipada e recursos de participantes duplicados mesclados por usuário
conectado ou nome de exibição. Passe `--no-merge-duplicates` para manter recursos de
participantes brutos separados, `--late-after-minutes` para ajustar a detecção de atraso e
`--early-before-minutes` para ajustar a detecção de saída antecipada.

`export` grava uma pasta contendo `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` e `manifest.json`.
`manifest.json` registra a entrada escolhida, opções de exportação, registros de conferência,
arquivos de saída, contagens, fonte de token, evento do Calendar quando usado e quaisquer
avisos de recuperação parcial. Passe `--zip` para também gravar um arquivo portátil ao lado
da pasta. Passe `--include-doc-bodies` para exportar o texto de Google Docs vinculados de transcrição e
notas inteligentes por meio de `files.export` do Google Drive; isso exige um
novo login OAuth que inclua o escopo somente leitura do Drive Meet. Sem
`--include-doc-bodies`, as exportações incluem apenas metadados do Meet e entradas de transcrição
estruturadas. Se o Google retornar uma falha parcial de artefato, como erro de listagem de notas
inteligentes, entrada de transcrição ou corpo de documento do Drive, o resumo e o
manifesto mantêm o aviso em vez de falhar a exportação inteira.
Use `--dry-run` para buscar os mesmos dados de artefatos/presença e imprimir o
JSON do manifesto sem criar a pasta ou o ZIP. Isso é útil antes de gravar
uma exportação grande ou quando um agente só precisa de contagens, registros selecionados e
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

Defina `"dryRun": true` para retornar apenas o manifesto de exportação e pular gravações de arquivo.

Execute o smoke live protegido contra uma reunião real retida:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Ambiente de smoke live:

- `OPENCLAW_LIVE_TEST=1` habilita testes live protegidos.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` aponta para uma URL, código ou
  `spaces/{id}` retido do Meet.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID` fornece o ID do cliente
  OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN` fornece
  o token de atualização.
- Opcional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` e
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` usam os mesmos nomes de fallback
  sem o prefixo `OPENCLAW_`.

O smoke live básico de artefatos/presença precisa de
`https://www.googleapis.com/auth/meetings.space.readonly` e
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. A consulta ao Calendar
precisa de `https://www.googleapis.com/auth/calendar.events.readonly`. A exportação do
corpo de documento do Drive precisa de
`https://www.googleapis.com/auth/drive.meet.readonly`.

Crie um novo espaço do Meet:

```bash
openclaw googlemeet create
```

O comando imprime o novo `meeting uri`, a fonte e a sessão de entrada. Com credenciais
OAuth, ele usa a API oficial do Google Meet. Sem credenciais OAuth, ele
usa como fallback o perfil de navegador conectado do Node do Chrome fixado. Agentes podem
usar a ferramenta `google_meet` com `action: "create"` para criar e entrar em uma única
etapa. Para criação apenas por URL, passe `"join": false`.

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

Se o fallback do navegador encontrar login do Google ou um bloqueio de permissão do Meet antes que
consiga criar a URL, o método do Gateway retornará uma resposta com falha e a
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

Quando um agente vê `manualActionRequired: true`, ele deve informar a
`manualActionMessage` mais o contexto de Node/aba do navegador e parar de abrir novas
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

Criar um Meet entra por padrão. O transporte do Chrome ou do Node do Chrome ainda
precisa de um perfil conectado do Google Chrome para entrar pelo navegador. Se o
perfil estiver desconectado, o OpenClaw informa `manualActionRequired: true` ou um
erro de fallback do navegador e pede ao operador para concluir o login do Google antes de
tentar novamente.

Defina `preview.enrollmentAcknowledged: true` somente depois de confirmar que seu projeto do Cloud,
principal OAuth e participantes da reunião estão inscritos no Google
Workspace Developer Preview Program para APIs de mídia do Meet.

## Configuração

O caminho comum em tempo real do Chrome só precisa do plugin habilitado, BlackHole, SoX
e uma chave de provedor de voz em tempo real de backend. OpenAI é o padrão; defina
`realtime.provider: "google"` para usar o Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
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
- `chromeNode.node`: ID/nome/IP opcional do Node para `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nome usado na tela de convidado desconectado do Meet
- `chrome.autoJoin: true`: preenchimento de nome de convidado em melhor esforço e clique em Entrar agora
  por meio da automação de navegador do OpenClaw em `chrome-node`
- `chrome.reuseExistingTab: true`: ativa uma aba existente do Meet em vez de
  abrir duplicatas
- `chrome.waitForInCallMs: 20000`: espera a aba do Meet informar que está em chamada
  antes que a introdução em tempo real seja acionada
- `chrome.audioFormat: "pcm16-24khz"`: formato de áudio de par de comandos. Use
  `"g711-ulaw-8khz"` apenas para pares de comandos legados/personalizados que ainda emitem
  áudio de telefonia.
- `chrome.audioInputCommand`: comando SoX que lê de `BlackHole 2ch` do CoreAudio
  e grava áudio em `chrome.audioFormat`
- `chrome.audioOutputCommand`: comando SoX que lê áudio em `chrome.audioFormat`
  e grava em `BlackHole 2ch` do CoreAudio
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: respostas faladas breves, com
  `openclaw_agent_consult` para respostas mais aprofundadas
- `realtime.introMessage`: verificação curta de prontidão falada quando a ponte em tempo real
  se conecta; defina como `""` para entrar silenciosamente
- `realtime.agentId`: ID opcional de agente do OpenClaw para
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

Configuração somente Twilio:

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

`voiceCall.enabled` assume `true` por padrão; com transporte Twilio, ele delega a
chamada PSTN real e o DTMF ao plugin Voice Call. Se `voice-call` não estiver
habilitado, o Google Meet ainda pode validar e registrar o plano de discagem, mas não pode
realizar a chamada Twilio.

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
`transport: "chrome-node"` quando o Chrome é executado em um nó pareado, como uma VM
do Parallels. Em ambos os casos, o modelo em tempo real e `openclaw_agent_consult` são executados no
host do Gateway, então as credenciais do modelo permanecem lá.

Use `action: "status"` para listar sessões ativas ou inspecionar um ID de sessão. Use
`action: "speak"` com `sessionId` e `message` para fazer o agente em tempo real
falar imediatamente. Use `action: "test_speech"` para criar ou reutilizar a sessão,
acionar uma frase conhecida e retornar a integridade `inCall` quando o host do Chrome puder
relatá-la. `test_speech` sempre força `mode: "realtime"` e falha se solicitado a
executar em `mode: "transcribe"` porque sessões apenas de observação intencionalmente não podem
emitir fala. Seu resultado `speechOutputVerified` é baseado no aumento dos bytes de saída de áudio em tempo real
durante esta chamada de teste, então uma sessão reutilizada com áudio antigo
não conta como uma nova verificação de fala bem-sucedida. Use `action: "leave"` para marcar
uma sessão como encerrada.

`status` inclui a integridade do Chrome quando disponível:

- `inCall`: o Chrome parece estar dentro da chamada do Meet
- `micMuted`: estado de melhor esforço do microfone do Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: o
  perfil do navegador precisa de login manual, admissão pelo anfitrião do Meet, permissões ou
  reparo do controle do navegador antes que a fala funcione
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: se
  a fala gerenciada pelo Chrome é permitida agora. `speechReady: false` significa que o OpenClaw
  não enviou a frase de introdução/teste para a ponte de áudio.
- `providerConnected` / `realtimeReady`: estado da ponte de voz em tempo real
- `lastInputAt` / `lastOutputAt`: último áudio visto vindo da ponte ou enviado para ela

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Consulta do agente em tempo real

O modo em tempo real do Chrome é otimizado para um ciclo de voz ao vivo. O provedor de voz em tempo real
ouve o áudio da reunião e fala pela ponte de áudio configurada.
Quando o modelo em tempo real precisa de raciocínio mais profundo, informações atuais ou ferramentas normais do
OpenClaw, ele pode chamar `openclaw_agent_consult`.

A ferramenta de consulta executa o agente regular do OpenClaw nos bastidores com o contexto recente
da transcrição da reunião e retorna uma resposta falada concisa para a sessão de voz em tempo real.
O modelo de voz pode então falar essa resposta de volta na reunião.
Ela usa a mesma ferramenta compartilhada de consulta em tempo real que o Voice Call.

Por padrão, as consultas são executadas no agente `main`. Defina `realtime.agentId` quando uma
rota do Meet deve consultar um workspace dedicado de agente do OpenClaw, padrões de modelo,
política de ferramentas, memória e histórico de sessão.

`realtime.toolPolicy` controla a execução da consulta:

- `safe-read-only`: expõe a ferramenta de consulta e limita o agente regular a
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e
  `memory_get`.
- `owner`: expõe a ferramenta de consulta e permite que o agente regular use a política normal
  de ferramentas do agente.
- `none`: não expõe a ferramenta de consulta ao modelo de voz em tempo real.

A chave da sessão de consulta é escopada por sessão do Meet, então chamadas de consulta de acompanhamento
podem reutilizar o contexto de consulta anterior durante a mesma reunião.

Para forçar uma verificação de prontidão falada depois que o Chrome entrou totalmente na chamada:

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

Para um host remoto do Chrome, como uma VM macOS do Parallels, esta é a verificação segura
mais curta depois de atualizar o Gateway ou a VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Isso comprova que o Plugin do Gateway está carregado, o nó da VM está conectado com o
token atual e a ponte de áudio do Meet está disponível antes que um agente abra uma
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

- `googlemeet setup` inclui verificações verdes de `twilio-voice-call-plugin` e
  `twilio-voice-call-credentials`.
- `voicecall` está disponível na CLI após o recarregamento do Gateway.
- A sessão retornada tem `transport: "twilio"` e um `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` encerra a chamada de voz delegada.

## Solução de problemas

### O agente não consegue ver a ferramenta do Google Meet

Confirme que o Plugin está habilitado na configuração do Gateway e recarregue o Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Se você acabou de editar `plugins.entries.google-meet`, reinicie ou recarregue o Gateway.
O agente em execução só vê ferramentas de Plugin registradas pelo processo atual do Gateway.

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

Em seguida, recarregue o serviço do nó e execute novamente:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### O navegador abre, mas o agente não consegue entrar

Execute `googlemeet test-speech` e inspecione a integridade do Chrome retornada. Se ela
relatar `manualActionRequired: true`, mostre `manualActionMessage` ao operador
e pare de tentar novamente até que a ação no navegador esteja concluída.

Ações manuais comuns:

- Entre no perfil do Chrome.
- Admita o convidado pela conta anfitriã do Meet.
- Conceda permissões de microfone/câmera ao Chrome quando o prompt de permissão nativo
  do Chrome aparecer.
- Feche ou repare uma caixa de diálogo de permissão do Meet travada.

Não relate "não conectado" só porque o Meet mostra "Do you want people to
hear you in the meeting?" Esse é o intersticial de escolha de áudio do Meet; o OpenClaw
clica em **Use microphone** por automação do navegador quando disponível e continua
aguardando o estado real da reunião. Para fallback de navegador apenas de criação, o OpenClaw
pode clicar em **Continue without microphone** porque criar a URL não precisa
do caminho de áudio em tempo real.

### Falha na criação da reunião

`googlemeet create` primeiro usa o endpoint `spaces.create` da API do Google Meet
quando credenciais OAuth estão configuradas. Sem credenciais OAuth, ele recorre
ao navegador do nó Chrome fixado. Confirme:

- Para criação por API: `oauth.clientId` e `oauth.refreshToken` estão configurados,
  ou variáveis de ambiente `OPENCLAW_GOOGLE_MEET_*` correspondentes estão presentes.
- Para criação por API: o token de atualização foi emitido depois que o suporte a criação foi
  adicionado. Tokens mais antigos podem não ter o escopo `meetings.space.created`; execute novamente
  `openclaw googlemeet auth login --json` e atualize a configuração do Plugin.
- Para fallback de navegador: `defaultTransport: "chrome-node"` e
  `chromeNode.node` apontam para um nó conectado com `browser.proxy` e
  `googlemeet.chrome`.
- Para fallback de navegador: o perfil do Chrome do OpenClaw nesse nó está conectado
  ao Google e consegue abrir `https://meet.google.com/new`.
- Para fallback de navegador: novas tentativas reutilizam uma aba existente de `https://meet.google.com/new`
  ou de prompt de conta Google antes de abrir uma nova aba. Se um agente expirar,
  repita a chamada da ferramenta em vez de abrir manualmente outra aba do Meet.
- Para fallback de navegador: se a ferramenta retornar `manualActionRequired: true`, use
  os valores retornados de `browser.nodeId`, `browser.targetId`, `browserUrl` e
  `manualActionMessage` para orientar o operador. Não tente novamente em loop até que essa
  ação esteja concluída.
- Para fallback de navegador: se o Meet mostrar "Do you want people to hear you in the
  meeting?", deixe a aba aberta. O OpenClaw deve clicar em **Use microphone** ou, para
  fallback apenas de criação, **Continue without microphone** por automação do navegador
  e continuar aguardando a URL do Meet gerada. Se não conseguir, o
  erro deve mencionar `meet-audio-choice-required`, não `google-login-required`.

### O agente entra, mas não fala

Verifique o caminho em tempo real:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Use `mode: "realtime"` para ouvir/responder por voz. `mode: "transcribe"` intencionalmente
não inicia a ponte de voz duplex em tempo real. `googlemeet test-speech`
sempre verifica o caminho em tempo real e relata se bytes de saída da ponte foram
observados nessa invocação. Se `speechOutputVerified` for falso e
`speechOutputTimedOut` for verdadeiro, o provedor em tempo real pode ter aceitado a
fala, mas o OpenClaw não viu novos bytes de saída chegarem à ponte de áudio do Chrome.

Também verifique:

- Uma chave de provedor em tempo real está disponível no host do Gateway, como
  `OPENAI_API_KEY` ou `GEMINI_API_KEY`.
- `BlackHole 2ch` está visível no host do Chrome.
- `sox` existe no host do Chrome.
- O microfone e o alto-falante do Meet estão roteados pelo caminho de áudio virtual usado pelo
  OpenClaw.

`googlemeet doctor [session-id]` imprime a sessão, o nó, o estado na chamada,
o motivo da ação manual, a conexão do provedor em tempo real, `realtimeReady`, atividade de
entrada/saída de áudio, últimos timestamps de áudio, contadores de bytes e URL do navegador.
Use `googlemeet status [session-id]` quando precisar do JSON bruto. Use
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
aba existente do Meet para o transporte selecionado. Com `chrome`, ela usa o controle local
do navegador por meio do Gateway; com `chrome-node`, ela usa o nó Chrome configurado.
Ela não abre uma nova aba nem cria uma nova sessão; ela relata o
bloqueador atual, como login, admissão, permissões ou estado de escolha de áudio.
O comando da CLI conversa com o Gateway configurado, então o Gateway deve estar em execução;
`chrome-node` também exige que o nó Chrome esteja conectado.

### Falhas nas verificações de configuração do Twilio

`twilio-voice-call-plugin` falha quando `voice-call` não é permitido ou não está habilitado.
Adicione-o a `plugins.allow`, habilite `plugins.entries.voice-call` e recarregue o
Gateway.

`twilio-voice-call-credentials` falha quando o backend da Twilio não tem o SID da
conta, o token de autenticação ou o número de origem. Defina-os no host do Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Depois reinicie ou recarregue o Gateway e execute:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` é apenas de prontidão por padrão. Para fazer uma simulação com um número específico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Adicione `--yes` somente quando você intencionalmente quiser fazer uma chamada
de notificação de saída ao vivo:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### A chamada da Twilio começa, mas nunca entra na reunião

Confirme que o evento do Meet expõe detalhes de discagem por telefone. Passe o
número de discagem exato e o PIN ou uma sequência DTMF personalizada:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Use `w` inicial ou vírgulas em `--dtmf-sequence` se o provedor precisar de uma pausa
antes de inserir o PIN.

## Observações

A API oficial de mídia do Google Meet é orientada ao recebimento, portanto falar em uma
chamada do Meet ainda precisa de um caminho de participante. Este plugin mantém esse limite visível:
o Chrome lida com a participação no navegador e o roteamento de áudio local; a Twilio lida com
a participação por discagem telefônica.

O modo em tempo real do Chrome precisa de `BlackHole 2ch` mais uma destas opções:

- `chrome.audioInputCommand` mais `chrome.audioOutputCommand`: o OpenClaw é responsável pela
  ponte do modelo em tempo real e encaminha o áudio em `chrome.audioFormat` entre esses
  comandos e o provedor de voz em tempo real selecionado. O caminho padrão do Chrome é
  PCM16 de 24 kHz; G.711 mu-law de 8 kHz continua disponível para pares de comandos legados.
- `chrome.audioBridgeCommand`: um comando de ponte externo é responsável por todo o caminho
  de áudio local e deve sair depois de iniciar ou validar seu daemon.

Para áudio duplex limpo, roteie a saída do Meet e o microfone do Meet por dispositivos
virtuais separados ou por um grafo de dispositivos virtuais no estilo Loopback. Um único
dispositivo BlackHole compartilhado pode ecoar outros participantes de volta para a chamada.

`googlemeet speak` aciona a ponte de áudio em tempo real ativa para uma sessão do Chrome.
`googlemeet leave` interrompe essa ponte. Para sessões da Twilio delegadas
por meio do Plugin de chamada de voz, `leave` também encerra a chamada de voz subjacente.

## Relacionados

- [Plugin de chamada de voz](/pt-BR/plugins/voice-call)
- [Modo de conversa](/pt-BR/nodes/talk)
- [Criando plugins](/pt-BR/plugins/building-plugins)
