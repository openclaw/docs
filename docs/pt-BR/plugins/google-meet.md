---
read_when:
    - Você quer que um agente OpenClaw entre em uma chamada do Google Meet
    - Você quer que um agente OpenClaw crie uma nova chamada do Google Meet
    - Você está configurando Chrome, Chrome node ou Twilio como transporte do Google Meet
summary: 'Plugin Google Meet: entrar em URLs explícitas do Meet por meio do Chrome ou Twilio com padrões de voz em tempo real'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-26T11:34:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bd53db711e4729a9a7b18f7aaa3eedffd71a1e19349fc858537652b5d17cfcb
    source_path: plugins/google-meet.md
    workflow: 15
---

Suporte a participantes do Google Meet para OpenClaw — o Plugin é explícito por design:

- Ele entra apenas em uma URL explícita `https://meet.google.com/...`.
- Ele pode criar um novo espaço do Meet por meio da API do Google Meet e então entrar na
  URL retornada.
- A voz `realtime` é o modo padrão.
- A voz em tempo real pode fazer callback para o agente completo do OpenClaw quando forem necessários
  raciocínio mais profundo ou ferramentas.
- Os agentes escolhem o comportamento de entrada com `mode`: use `realtime` para ouvir/falar de volta ao vivo, ou `transcribe` para entrar/controlar o navegador sem a bridge de voz em tempo real.
- A autenticação começa como OAuth pessoal do Google ou um perfil do Chrome já autenticado.
- Não há anúncio automático de consentimento.
- O backend de áudio padrão do Chrome é `BlackHole 2ch`.
- O Chrome pode ser executado localmente ou em um host de node pareado.
- O Twilio aceita um número de discagem mais um PIN ou sequência DTMF opcionais.
- O comando da CLI é `googlemeet`; `meet` é reservado para fluxos mais amplos de teleconferência de agentes.

## Início rápido

Instale as dependências locais de áudio e configure um provider de voz em tempo real no backend.
OpenAI é o padrão; Google Gemini Live também funciona com
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# ou
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
command -v rec play
```

Ative o Plugin:

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

A saída da configuração foi feita para ser legível por agentes. Ela relata perfil do Chrome,
bridge de áudio, pinning de node, introdução atrasada do realtime e, quando a delegação Twilio
está configurada, se o Plugin `voice-call` e as credenciais do Twilio estão prontos.
Trate qualquer verificação com `ok: false` como um bloqueador antes de pedir a um agente para entrar.
Use `openclaw googlemeet setup --json` para scripts ou saída legível por máquina.
Use `--transport chrome`, `--transport chrome-node` ou `--transport twilio`
para fazer um preflight de um transporte específico antes que um agente tente usá-lo.

Entrar em uma reunião:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Ou deixe um agente entrar por meio da ferramenta `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Criar uma nova reunião e entrar nela:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Criar apenas a URL sem entrar:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` tem dois caminhos:

- Criação por API: usada quando credenciais OAuth do Google Meet estão configuradas. Este é
  o caminho mais determinístico e não depende do estado da UI do navegador.
- Fallback por navegador: usado quando as credenciais OAuth estão ausentes. O OpenClaw usa o node Chrome fixado, abre `https://meet.google.com/new`, espera o Google redirecionar para uma URL real de código de reunião e então retorna essa URL. Esse caminho exige
  que o perfil do Chrome do OpenClaw no node já esteja autenticado no Google.
  A automação do navegador lida com o próprio prompt inicial de microfone do Meet; esse prompt
  não é tratado como falha de login do Google.
  Fluxos de entrada e criação também tentam reutilizar uma aba existente do Meet antes de abrir uma
  nova. A correspondência ignora strings de query inofensivas como `authuser`, então uma nova tentativa do
  agente deve focar a reunião já aberta em vez de criar uma segunda aba do Chrome.

A saída do comando/ferramenta inclui um campo `source` (`api` ou `browser`) para que agentes
possam explicar qual caminho foi usado. `create` entra na nova reunião por padrão e
retorna `joined: true` mais a sessão de entrada. Para apenas gerar a URL, use
`create --no-join` na CLI ou passe `"join": false` para a ferramenta.

Ou diga a um agente: "Crie um Google Meet, entre com voz em tempo real e me envie
o link." O agente deve chamar `google_meet` com `action: "create"` e
depois compartilhar o `meetingUri` retornado.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Para uma entrada apenas de observação/controle do navegador, defina `"mode": "transcribe"`. Isso
não inicia a bridge duplex do modelo em tempo real, então ele não falará de volta na
reunião.

Durante sessões em tempo real, o status de `google_meet` inclui integridade do navegador e da bridge
de áudio, como `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, timestamps do último input/output,
contadores de bytes e estado de bridge fechada. Se aparecer um prompt seguro da página do Meet,
a automação do navegador lida com ele quando possível. Prompts de login, admissão do host e
permissões do navegador/SO são relatados como ação manual com um motivo e uma
mensagem para o agente retransmitir.

O Chrome entra usando o perfil autenticado do Chrome. No Meet, escolha `BlackHole 2ch` para o
caminho de microfone/alto-falante usado pelo OpenClaw. Para áudio duplex limpo, use
dispositivos virtuais separados ou um grafo no estilo Loopback; um único dispositivo BlackHole é
suficiente para um primeiro smoke test, mas pode gerar eco.

### Gateway local + Chrome no Parallels

Você **não** precisa de um Gateway completo do OpenClaw nem de uma chave de API de modelo dentro de uma VM macOS
apenas para fazer a VM ser dona do Chrome. Execute o Gateway e o agente localmente e depois execute um
host de node na VM. Ative o Plugin incluído na VM uma vez para que o node
anuncie o comando do Chrome:

O que roda onde:

- Host do Gateway: Gateway do OpenClaw, workspace do agente, chaves de modelo/API, provider
  realtime e a configuração do Plugin Google Meet.
- VM macOS no Parallels: CLI/host de node do OpenClaw, Google Chrome, SoX, BlackHole 2ch
  e um perfil do Chrome autenticado no Google.
- Não é necessário na VM: serviço Gateway, configuração de agente, chave OpenAI/GPT ou configuração de
  provider de modelo.

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
command -v rec play
```

Instale ou atualize o OpenClaw na VM e então ative o Plugin incluído ali:

```bash
openclaw plugins enable google-meet
```

Inicie o host de node na VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Se `<gateway-host>` for um IP de LAN e você não estiver usando TLS, o node recusará o
WebSocket em texto simples, a menos que você ative isso explicitamente para essa rede privada confiável:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` é uma variável de ambiente de processo, não uma
configuração de `openclaw.json`. `openclaw node install` a armazena no ambiente do LaunchAgent
quando ela está presente no comando de instalação.

Aprove o node a partir do host do Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirme que o Gateway vê o node e que ele anuncia `googlemeet.chrome`
e capacidade de navegador/`browser.proxy`:

```bash
openclaw nodes status
```

Encaminhe o Meet por esse node no host do Gateway:

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

Para um smoke test de um comando que cria ou reutiliza uma sessão, fala uma frase
conhecida e imprime a integridade da sessão:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante a entrada, a automação de navegador do OpenClaw preenche o nome do convidado, clica em Join/Ask
to join e aceita a escolha inicial “Use microphone” do Meet quando esse prompt
aparece. Durante a criação de reunião apenas por navegador, ela também pode continuar além do
mesmo prompt sem microfone se o Meet não expuser o botão de usar microfone.
Se o perfil do navegador não estiver autenticado, o Meet estiver aguardando admissão do host,
o Chrome precisar de permissão de microfone/câmera ou o Meet estiver preso em um
prompt que a automação não conseguiu resolver, o resultado de join/test-speech relata
`manualActionRequired: true` com `manualActionReason` e
`manualActionMessage`. Os agentes devem parar de tentar entrar repetidamente,
relatar essa mensagem exata mais o `browserUrl`/`browserTitle` atuais e
tentar novamente somente depois que a ação manual no navegador estiver concluída.

Se `chromeNode.node` for omitido, o OpenClaw faz seleção automática apenas quando exatamente um
node conectado anuncia tanto `googlemeet.chrome` quanto controle de navegador. Se
vários nodes compatíveis estiverem conectados, defina `chromeNode.node` com o id do node,
nome de exibição ou IP remoto.

Verificações comuns de falha:

- `Configured Google Meet node ... is not usable: offline`: o node fixado é
  conhecido pelo Gateway, mas está indisponível. Os agentes devem tratar esse node como
  estado de diagnóstico, não como um host Chrome utilizável, e relatar o bloqueador de configuração
  em vez de recorrer a outro transporte, a menos que o usuário tenha pedido isso.
- `No connected Google Meet-capable node`: inicie `openclaw node run` na VM,
  aprove o pareamento e certifique-se de que `openclaw plugins enable google-meet` e
  `openclaw plugins enable browser` foram executados na VM. Confirme também que o
  host do Gateway permite ambos os comandos de node com
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: instale `blackhole-2ch` no host
  que está sendo verificado e reinicie antes de usar o áudio local do Chrome.
- `BlackHole 2ch audio device not found on the node`: instale `blackhole-2ch`
  na VM e reinicie a VM.
- O Chrome abre, mas não consegue entrar: autentique-se no perfil do navegador dentro da VM, ou
  mantenha `chrome.guestName` definido para entrada como convidado. A entrada automática como convidado usa a automação de navegador do OpenClaw por meio do proxy de navegador do node; certifique-se de que a configuração de navegador do node aponte para o perfil desejado, por exemplo
  `browser.defaultProfile: "user"` ou um perfil nomeado de sessão existente.
- Abas duplicadas do Meet: mantenha `chrome.reuseExistingTab: true` ativado. O OpenClaw
  ativa uma aba existente para a mesma URL do Meet antes de abrir uma nova, e
  a criação de reunião no navegador reutiliza uma aba em andamento de `https://meet.google.com/new`
  ou de prompt de conta Google antes de abrir outra.
- Sem áudio: no Meet, encaminhe microfone/alto-falante pelo caminho do dispositivo de áudio virtual
  usado pelo OpenClaw; use dispositivos virtuais separados ou roteamento no estilo Loopback
  para áudio duplex limpo.

## Observações de instalação

O padrão realtime do Chrome usa duas ferramentas externas:

- `sox`: utilitário de áudio em linha de comando. O Plugin usa seus comandos `rec` e `play`
  para a bridge de áudio padrão G.711 mu-law de 8 kHz.
- `blackhole-2ch`: driver de áudio virtual do macOS. Ele cria o dispositivo de áudio
  `BlackHole 2ch` pelo qual o Chrome/Meet pode ser roteado.

O OpenClaw não inclui nem redistribui nenhum dos dois pacotes. A documentação pede aos usuários que
os instalem como dependências do host por meio do Homebrew. O SoX é licenciado como
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole é GPL-3.0. Se você criar um
instalador ou appliance que inclua o BlackHole com o OpenClaw, revise os
termos de licença upstream do BlackHole ou obtenha uma licença separada da Existential Audio.

## Transportes

### Chrome

O transporte Chrome abre a URL do Meet no Google Chrome e entra usando o perfil
autenticado do Chrome. No macOS, o Plugin verifica `BlackHole 2ch` antes da inicialização.
Se configurado, ele também executa um comando de verificação de integridade da bridge de áudio e um comando de inicialização
antes de abrir o Chrome. Use `chrome` quando Chrome/áudio estiverem no host do Gateway;
use `chrome-node` quando Chrome/áudio estiverem em um node pareado, como uma VM macOS no Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Encaminhe o áudio de microfone e alto-falante do Chrome pela bridge de áudio local do OpenClaw.
Se `BlackHole 2ch` não estiver instalado, a entrada falha com um erro de configuração
em vez de entrar silenciosamente sem um caminho de áudio.

### Twilio

O transporte Twilio é um plano de discagem estrito delegado ao Plugin Voice Call. Ele
não analisa páginas do Meet em busca de números de telefone.

Use isso quando a participação por Chrome não estiver disponível ou quando você quiser um
fallback por discagem telefônica. O Google Meet precisa expor um número de discagem e PIN para a
reunião; o OpenClaw não descobre isso a partir da página do Meet.

Ative o Plugin Voice Call no host do Gateway, não no node Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // ou defina "twilio" se Twilio deve ser o padrão
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

Forneça credenciais do Twilio por ambiente ou configuração. O ambiente mantém os
segredos fora de `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Reinicie ou recarregue o Gateway após ativar `voice-call`; alterações na configuração do Plugin
não aparecem em um processo do Gateway já em execução até que ele seja recarregado.

Depois verifique:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Quando a delegação Twilio estiver conectada, `googlemeet setup` inclui verificações bem-sucedidas
de `twilio-voice-call-plugin` e `twilio-voice-call-credentials`.

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

OAuth é opcional para criar um link do Meet porque `googlemeet create` pode recorrer
à automação do navegador. Configure OAuth quando quiser a criação oficial por API,
resolução de espaços ou verificações de preflight da API Meet Media.

O acesso à API do Google Meet usa OAuth de usuário: crie um cliente OAuth do Google Cloud,
solicite os scopes necessários, autorize uma conta Google e depois armazene o
refresh token resultante na configuração do Plugin Google Meet ou forneça as
variáveis de ambiente `OPENCLAW_GOOGLE_MEET_*`.

OAuth não substitui o caminho de entrada por Chrome. Os transportes Chrome e Chrome-node
ainda entram por meio de um perfil do Chrome autenticado, BlackHole/SoX e um node
conectado quando você usa participação pelo navegador. OAuth é apenas para o caminho oficial da
API do Google Meet: criar espaços de reunião, resolver espaços e executar verificações de preflight da API Meet Media.

### Criar credenciais Google

No Google Cloud Console:

1. Crie ou selecione um projeto do Google Cloud.
2. Ative a **Google Meet REST API** para esse projeto.
3. Configure a tela de consentimento OAuth.
   - **Internal** é o mais simples para uma organização Google Workspace.
   - **External** funciona para configurações pessoais/de teste; enquanto o app estiver em Testing,
     adicione cada conta Google que autorizará o app como usuário de teste.
4. Adicione os scopes solicitados pelo OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Crie um client ID OAuth.
   - Tipo de aplicativo: **Web application**.
   - URI de redirecionamento autorizado:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Copie o client ID e o client secret.

`meetings.space.created` é necessário para `spaces.create` do Google Meet.
`meetings.space.readonly` permite que o OpenClaw resolva URLs/códigos do Meet para espaços.
`meetings.conference.media.readonly` é para preflight da API Meet Media e trabalho com mídia;
o Google pode exigir inscrição no Developer Preview para uso real da Media API.
Se você só precisa de entradas pelo Chrome baseadas em navegador, ignore o OAuth totalmente.

### Gerar o refresh token

Configure `oauth.clientId` e opcionalmente `oauth.clientSecret`, ou passe-os como
variáveis de ambiente, e então execute:

```bash
openclaw googlemeet auth login --json
```

O comando imprime um bloco de configuração `oauth` com um refresh token. Ele usa PKCE,
callback localhost em `http://localhost:8085/oauth2callback` e um fluxo manual
de copiar/colar com `--manual`.

Exemplos:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Use o modo manual quando o navegador não conseguir alcançar o callback local:

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

Armazene o objeto `oauth` sob a configuração do Plugin Google Meet:

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
Se ambos, configuração e ambiente, estiverem presentes, o Plugin resolve primeiro a configuração
e depois usa o ambiente como fallback.

O consentimento OAuth inclui criação de espaço do Meet, acesso de leitura a espaço do Meet e acesso de leitura a mídia
de conferência do Meet. Se você se autenticou antes de existir
suporte à criação de reunião, execute novamente `openclaw googlemeet auth login --json` para que o refresh
token tenha o scope `meetings.space.created`.

### Verificar OAuth com doctor

Execute o doctor de OAuth quando quiser uma verificação rápida e sem segredos de integridade:

```bash
openclaw googlemeet doctor --oauth --json
```

Isso não carrega o runtime do Chrome nem exige um node Chrome conectado. Ele
verifica se a configuração OAuth existe e se o refresh token consegue gerar um access
token. O relatório JSON inclui apenas campos de status como `ok`, `configured`,
`tokenSource`, `expiresAt` e mensagens de verificação; ele não imprime o access
token, refresh token nem client secret.

Resultados comuns:

| Verificação          | Significado                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` mais `oauth.refreshToken`, ou um access token em cache, está presente.    |
| `oauth-token`        | O access token em cache ainda é válido, ou o refresh token gerou um novo access token.     |
| `meet-spaces-get`    | A verificação opcional `--meeting` resolveu um espaço do Meet existente.                    |
| `meet-spaces-create` | A verificação opcional `--create-space` criou um novo espaço do Meet.                       |

Para comprovar também a ativação da API do Google Meet e o scope `spaces.create`, execute a
verificação de criação com efeito colateral:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` cria uma URL descartável do Meet. Use-o quando precisar confirmar
que o projeto do Google Cloud tem a API Meet ativada e que a conta autorizada
tem o scope `meetings.space.created`.

Para comprovar acesso de leitura a um espaço de reunião existente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` e `resolve-space` comprovam acesso de leitura a um
espaço existente que a conta Google autorizada consegue acessar. Um `403` nessas verificações
normalmente significa que a Google Meet REST API está desativada, que o refresh token com consentimento
não tem o scope necessário ou que a conta Google não consegue acessar esse espaço do Meet. Um erro de refresh token significa executar novamente `openclaw googlemeet auth login
--json` e armazenar o novo bloco `oauth`.

Nenhuma credencial OAuth é necessária para o fallback pelo navegador. Nesse modo, a autenticação do Google
vem do perfil autenticado do Chrome no node selecionado, não da configuração do OpenClaw.

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

Execute o preflight antes de trabalhar com mídia:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Liste artefatos da reunião e presença depois que o Meet tiver criado os registros de conferência:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Com `--meeting`, `artifacts` e `attendance` usam por padrão o registro de conferência mais recente.
Passe `--all-conference-records` quando quiser todos os registros retidos
para essa reunião.

A busca em calendário pode resolver a URL da reunião a partir do Google Calendar antes de ler
artefatos do Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` pesquisa no calendário `primary` de hoje por um evento do Calendar com um
link do Google Meet. Use `--event <query>` para pesquisar texto de evento correspondente e
`--calendar <id>` para um calendário não primário. A busca em calendário exige um
novo login OAuth que inclua o scope readonly de eventos do Calendar.
`calendar-events` pré-visualiza os eventos Meet correspondentes e marca o evento que
`latest`, `artifacts`, `attendance` ou `export` escolherá.

Se você já souber o id do registro de conferência, direcione-o diretamente:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Grave um relatório legível:

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

`artifacts` retorna metadados do registro da conferência mais metadados de recursos de participante,
gravação, transcrição, entrada estruturada de transcrição e smart note quando o
Google os expõe para a reunião. Use `--no-transcript-entries` para ignorar a
busca de entradas em reuniões grandes. `attendance` expande participantes em
linhas de sessão de participante com horários de primeira/última visualização, duração total da sessão,
flags de atraso/saída antecipada e recursos duplicados de participante mesclados por usuário autenticado
ou nome de exibição. Passe `--no-merge-duplicates` para manter recursos brutos
de participante separados, `--late-after-minutes` para ajustar a detecção de atraso e
`--early-before-minutes` para ajustar a detecção de saída antecipada.

`export` grava uma pasta contendo `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` e `manifest.json`.
`manifest.json` registra a entrada escolhida, opções de exportação, registros de conferência,
arquivos de saída, contagens, origem do token, evento do Calendar quando foi usado e quaisquer avisos de recuperação parcial. Passe `--zip` para também gravar um arquivo portátil ao lado da pasta. Passe `--include-doc-bodies` para exportar texto de Google Docs vinculado a transcrição e smart note por meio de `files.export` do Google Drive; isso exige um novo login OAuth que inclua o scope readonly do Drive Meet. Sem
`--include-doc-bodies`, as exportações incluem apenas metadados do Meet e entradas estruturadas de transcrição. Se o Google retornar uma falha parcial de artefato, como um erro de listagem de smart note,
entrada de transcrição ou corpo de documento do Drive, o resumo e o
manifesto mantêm o aviso em vez de fazer a exportação inteira falhar.
Use `--dry-run` para buscar os mesmos dados de artefatos/presença e imprimir o
JSON do manifesto sem criar a pasta nem o ZIP. Isso é útil antes de gravar
uma exportação grande ou quando um agente só precisa de contagens, registros selecionados e
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

Defina `"dryRun": true` para retornar apenas o manifesto de exportação e ignorar gravações em arquivo.

Execute o smoke ao vivo protegido contra uma reunião real retida:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Ambiente do smoke ao vivo:

- `OPENCLAW_LIVE_TEST=1` ativa testes ao vivo protegidos.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` aponta para uma URL, código ou
  `spaces/{id}` do Meet retido.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID` fornece o client id
  OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN` fornece
  o refresh token.
- Opcional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` e
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` usam os mesmos nomes de fallback
  sem o prefixo `OPENCLAW_`.

O smoke ao vivo básico de artefatos/presença precisa de
`https://www.googleapis.com/auth/meetings.space.readonly` e
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. A busca no Calendar
precisa de `https://www.googleapis.com/auth/calendar.events.readonly`. A exportação
do corpo de documento do Drive precisa de
`https://www.googleapis.com/auth/drive.meet.readonly`.

Criar um espaço novo do Meet:

```bash
openclaw googlemeet create
```

O comando imprime o novo `meeting uri`, a origem e a sessão de entrada. Com credenciais OAuth
ele usa a Google Meet API oficial. Sem credenciais OAuth ele
usa o perfil de navegador autenticado do node Chrome fixado como fallback. Os agentes podem
usar a ferramenta `google_meet` com `action: "create"` para criar e entrar em uma única
etapa. Para criação apenas da URL, passe `"join": false`.

Exemplo de saída JSON do fallback pelo navegador:

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

Se o fallback pelo navegador encontrar um login do Google ou um bloqueador de permissão do Meet antes de
conseguir criar a URL, o método do Gateway retorna uma resposta com falha e a
ferramenta `google_meet` retorna detalhes estruturados em vez de uma string simples:

```json
{
  "source": "browser",
  "error": "google-login-required: Faça login no Google no perfil do navegador do OpenClaw e tente novamente a criação da reunião.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Faça login no Google no perfil do navegador do OpenClaw e tente novamente a criação da reunião.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

Quando um agente vê `manualActionRequired: true`, ele deve relatar a
`manualActionMessage` mais o contexto de node/aba do navegador e parar de abrir novas
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

Criar um Meet entra por padrão. O transporte Chrome ou Chrome-node ainda
precisa de um perfil do Google Chrome autenticado para entrar pelo navegador. Se o
perfil estiver desconectado, o OpenClaw relata `manualActionRequired: true` ou um
erro de fallback do navegador e pede ao operador para concluir o login do Google antes de
tentar novamente.

Defina `preview.enrollmentAcknowledged: true` somente após confirmar que seu projeto Cloud,
principal OAuth e participantes da reunião estão inscritos no Google
Workspace Developer Preview Program para APIs de mídia do Meet.

## Configuração

O caminho comum realtime do Chrome só precisa do Plugin ativado, BlackHole, SoX
e uma chave de provider de voz realtime de backend. OpenAI é o padrão; defina
`realtime.provider: "google"` para usar Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# ou
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
- `chromeNode.node`: id/nome/IP opcional do node para `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nome usado na tela de convidado desconectado do Meet
- `chrome.autoJoin: true`: preenchimento best-effort do nome de convidado e clique em Join Now
  por meio da automação de navegador do OpenClaw em `chrome-node`
- `chrome.reuseExistingTab: true`: ativa uma aba existente do Meet em vez de
  abrir duplicadas
- `chrome.waitForInCallMs: 20000`: aguarda a aba do Meet relatar que está na chamada
  antes que a introdução realtime seja acionada
- `chrome.audioInputCommand`: comando SoX `rec` gravando áudio
  G.711 mu-law de 8 kHz em stdout
- `chrome.audioOutputCommand`: comando SoX `play` lendo áudio
  G.711 mu-law de 8 kHz de stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: respostas faladas curtas, com
  `openclaw_agent_consult` para respostas mais profundas
- `realtime.introMessage`: verificação curta falada de prontidão quando a bridge realtime
  conecta; defina como `""` para entrar em silêncio

Substituições opcionais:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    toolPolicy: "owner",
    introMessage: "Diga exatamente: Estou aqui.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Configuração apenas com Twilio:

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

`voiceCall.enabled` tem padrão `true`; com transporte Twilio ele delega a
chamada PSTN real e DTMF ao Plugin Voice Call. Se `voice-call` não
estiver ativado, o Google Meet ainda pode validar e registrar o plano de discagem, mas não consegue
fazer a chamada Twilio.

## Ferramenta

Os agentes podem usar a ferramenta `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Use `transport: "chrome"` quando o Chrome estiver em execução no host do Gateway. Use
`transport: "chrome-node"` quando o Chrome estiver em execução em um node pareado, como uma VM do Parallels.
Nos dois casos, o modelo realtime e `openclaw_agent_consult` são executados no
host do Gateway, então as credenciais do modelo permanecem lá.

Use `action: "status"` para listar sessões ativas ou inspecionar um ID de sessão. Use
`action: "speak"` com `sessionId` e `message` para fazer o agente realtime
falar imediatamente. Use `action: "test_speech"` para criar ou reutilizar a sessão,
acionar uma frase conhecida e retornar a integridade `inCall` quando o host Chrome
conseguir relatá-la. Use `action: "leave"` para marcar uma sessão como encerrada.

`status` inclui integridade do Chrome quando disponível:

- `inCall`: o Chrome parece estar dentro da chamada do Meet
- `micMuted`: estado best-effort do microfone no Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: o
  perfil do navegador precisa de login manual, admissão pelo host no Meet, permissões ou
  reparo de controle do navegador antes que a fala funcione
- `providerConnected` / `realtimeReady`: estado da bridge de voz realtime
- `lastInputAt` / `lastOutputAt`: último áudio visto ou enviado para a bridge

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Diga exatamente: Estou aqui e ouvindo."
}
```

## Consulta ao agente realtime

O modo Chrome realtime é otimizado para um loop de voz ao vivo. O provider de voz
realtime ouve o áudio da reunião e fala por meio da bridge de áudio configurada.
Quando o modelo realtime precisa de raciocínio mais profundo, informações atuais ou ferramentas normais do
OpenClaw, ele pode chamar `openclaw_agent_consult`.

A ferramenta de consulta executa o agente normal do OpenClaw nos bastidores com contexto recente da transcrição da reunião e retorna uma resposta falada concisa para a sessão de voz realtime. O modelo de voz pode então falar essa resposta de volta na reunião.
Ela usa a mesma ferramenta compartilhada de consulta realtime do Voice Call.

`realtime.toolPolicy` controla a execução da consulta:

- `safe-read-only`: expõe a ferramenta de consulta e limita o agente normal a
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e
  `memory_get`.
- `owner`: expõe a ferramenta de consulta e deixa o agente normal usar a política
  normal de ferramentas do agente.
- `none`: não expõe a ferramenta de consulta ao modelo de voz realtime.

A chave de sessão da consulta tem escopo por sessão do Meet, para que chamadas de consulta de acompanhamento
possam reutilizar o contexto anterior da consulta durante a mesma reunião.

Para forçar uma verificação falada de prontidão depois que o Chrome tiver entrado totalmente na chamada:

```bash
openclaw googlemeet speak meet_... "Diga exatamente: Estou aqui e ouvindo."
```

Para o smoke completo de entrar e falar:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Diga exatamente: Google Meet speech test complete."
```

## Checklist de teste ao vivo

Use esta sequência antes de entregar uma reunião a um agente sem supervisão:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Diga exatamente: Google Meet speech test complete."
```

Estado esperado de `chrome-node`:

- `googlemeet setup` está totalmente verde.
- `googlemeet setup` inclui `chrome-node-connected` quando `chrome-node` é o
  transporte padrão ou um node está fixado.
- `nodes status` mostra o node selecionado conectado.
- O node selecionado anuncia tanto `googlemeet.chrome` quanto `browser.proxy`.
- A aba do Meet entra na chamada e `test-speech` retorna integridade do Chrome com
  `inCall: true`.

Para um host Chrome remoto, como uma VM macOS no Parallels, esta é a verificação segura
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
token atual e que a bridge de áudio do Meet está disponível antes que um agente abra uma
aba real de reunião.

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
- `voicecall` está disponível na CLI após o reload do Gateway.
- A sessão retornada tem `transport: "twilio"` e um `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` encerra a chamada de voz delegada.

## Solução de problemas

### O agente não consegue ver a ferramenta Google Meet

Confirme que o Plugin está ativado na configuração do Gateway e recarregue o Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Se você acabou de editar `plugins.entries.google-meet`, reinicie ou recarregue o Gateway.
O agente em execução só vê ferramentas de Plugin registradas pelo processo atual
do Gateway.

### Nenhum node conectado compatível com Google Meet

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

O node precisa estar conectado e listar `googlemeet.chrome` mais `browser.proxy`.
A configuração do Gateway precisa permitir esses comandos de node:

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
`gateway token mismatch`, reinstale ou reinicie o node com o token atual do Gateway. Para um Gateway em LAN, isso normalmente significa:

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

Execute `googlemeet test-speech` e inspecione a integridade do Chrome retornada. Se ele
relatar `manualActionRequired: true`, mostre `manualActionMessage` ao operador
e pare de tentar novamente até que a ação no navegador seja concluída.

Ações manuais comuns:

- Fazer login no perfil do Chrome.
- Admitir o convidado pela conta host do Meet.
- Conceder permissões de microfone/câmera ao Chrome quando o prompt nativo
  de permissão do Chrome aparecer.
- Fechar ou reparar uma caixa de diálogo de permissão do Meet travada.

Não relate “não autenticado” só porque o Meet mostra “Do you want people to
hear you in the meeting?”. Esse é o intersticial de escolha de áudio do Meet; o OpenClaw
clica em **Use microphone** por meio da automação do navegador quando disponível e continua
aguardando o estado real da reunião. Para fallback de criação apenas por navegador, o OpenClaw
pode clicar em **Continue without microphone** porque criar a URL não precisa
do caminho de áudio realtime.

### A criação da reunião falha

`googlemeet create` primeiro usa o endpoint `spaces.create` da Google Meet API
quando credenciais OAuth estão configuradas. Sem credenciais OAuth ele recorre
ao navegador do node Chrome fixado. Confirme:

- Para criação por API: `oauth.clientId` e `oauth.refreshToken` estão configurados,
  ou variáveis de ambiente `OPENCLAW_GOOGLE_MEET_*` correspondentes estão presentes.
- Para criação por API: o refresh token foi gerado depois que o suporte a criação foi
  adicionado. Tokens mais antigos podem não ter o scope `meetings.space.created`; execute novamente
  `openclaw googlemeet auth login --json` e atualize a configuração do Plugin.
- Para fallback por navegador: `defaultTransport: "chrome-node"` e
  `chromeNode.node` apontam para um node conectado com `browser.proxy` e
  `googlemeet.chrome`.
- Para fallback por navegador: o perfil do Chrome do OpenClaw nesse node está autenticado
  no Google e consegue abrir `https://meet.google.com/new`.
- Para fallback por navegador: novas tentativas reutilizam uma aba existente de `https://meet.google.com/new`
  ou de prompt de conta Google antes de abrir uma nova. Se um agente expirar,
  tente novamente a chamada da ferramenta em vez de abrir manualmente outra aba do Meet.
- Para fallback por navegador: se a ferramenta retornar `manualActionRequired: true`, use
  `browser.nodeId`, `browser.targetId`, `browserUrl` e
  `manualActionMessage` retornados para orientar o operador. Não tente novamente em loop até que essa
  ação seja concluída.
- Para fallback por navegador: se o Meet mostrar “Do you want people to hear you in the
  meeting?”, deixe a aba aberta. O OpenClaw deve clicar em **Use microphone** ou, para
  fallback apenas de criação, em **Continue without microphone** por meio da automação do navegador e continuar aguardando a URL gerada do Meet. Se não conseguir, o
  erro deve mencionar `meet-audio-choice-required`, não `google-login-required`.

### O agente entra, mas não fala

Verifique o caminho realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Use `mode: "realtime"` para ouvir/falar de volta. `mode: "transcribe"` intencionalmente
não inicia a bridge duplex de voz em tempo real.

Verifique também:

- Uma chave de provider realtime está disponível no host do Gateway, como
  `OPENAI_API_KEY` ou `GEMINI_API_KEY`.
- `BlackHole 2ch` está visível no host do Chrome.
- `rec` e `play` existem no host do Chrome.
- O microfone e o alto-falante do Meet estão roteados pelo caminho de áudio virtual usado pelo
  OpenClaw.

`googlemeet doctor [session-id]` imprime a sessão, node, estado in-call,
motivo de ação manual, conexão do provider realtime, `realtimeReady`, atividade de
entrada/saída de áudio, timestamps do último áudio, contadores de bytes e URL do navegador.
Use `googlemeet status [session-id]` quando precisar do JSON bruto. Use
`googlemeet doctor --oauth` quando precisar verificar o refresh do OAuth do Google Meet
sem expor tokens; adicione `--meeting` ou `--create-space` quando também precisar de uma prova da Google Meet API.

Se um agente expirou e você consegue ver uma aba do Meet já aberta, inspecione essa aba
sem abrir outra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

A ação equivalente da ferramenta é `recover_current_tab`. Ela foca e inspeciona uma
aba existente do Meet para o transporte selecionado. Com `chrome`, usa controle local
do navegador por meio do Gateway; com `chrome-node`, usa o node Chrome configurado. Ela não abre uma nova aba nem cria uma nova sessão; relata o
bloqueador atual, como login, admissão, permissões ou estado de escolha de áudio.
O comando da CLI fala com o Gateway configurado, então o Gateway precisa estar em execução;
`chrome-node` também exige que o node Chrome esteja conectado.

### Verificações de configuração do Twilio falham

`twilio-voice-call-plugin` falha quando `voice-call` não está permitido ou não está ativado.
Adicione-o a `plugins.allow`, ative `plugins.entries.voice-call` e recarregue o
Gateway.

`twilio-voice-call-credentials` falha quando o backend do Twilio não tem account
SID, auth token ou número de origem. Defina isso no host do Gateway:

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

`voicecall smoke` por padrão é apenas de prontidão. Para fazer dry-run com um número específico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Adicione `--yes` somente quando você quiser intencionalmente fazer uma chamada
real de notificação de saída:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### A chamada Twilio começa, mas nunca entra na reunião

Confirme que o evento do Meet expõe detalhes de discagem por telefone. Passe o número de discagem
e PIN exatos ou uma sequência DTMF personalizada:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Use `w` inicial ou vírgulas em `--dtmf-sequence` se o provider precisar de uma pausa
antes de inserir o PIN.

## Observações

A API oficial de mídia do Google Meet é orientada a recepção, então falar em uma chamada do Meet
ainda exige um caminho de participante. Este Plugin mantém esse limite visível:
o Chrome lida com a participação pelo navegador e o roteamento local de áudio; o Twilio lida
com a participação por discagem telefônica.

O modo Chrome realtime precisa de um dos seguintes:

- `chrome.audioInputCommand` mais `chrome.audioOutputCommand`: o OpenClaw é dono da
  bridge do modelo realtime e canaliza áudio G.711 mu-law de 8 kHz entre esses
  comandos e o provider de voz realtime selecionado.
- `chrome.audioBridgeCommand`: um comando externo de bridge é dono de todo o caminho local
  de áudio e deve sair depois de iniciar ou validar seu daemon.

Para áudio duplex limpo, encaminhe a saída do Meet e o microfone do Meet por
dispositivos virtuais separados ou por um grafo de dispositivo virtual no estilo Loopback. Um único dispositivo
BlackHole compartilhado pode ecoar outros participantes de volta para a chamada.

`googlemeet speak` aciona a bridge de áudio realtime ativa para uma sessão
Chrome. `googlemeet leave` interrompe essa bridge. Para sessões Twilio delegadas
por meio do Plugin Voice Call, `leave` também encerra a chamada de voz subjacente.

## Relacionado

- [Plugin Voice Call](/pt-BR/plugins/voice-call)
- [Modo Talk](/pt-BR/nodes/talk)
- [Criando Plugins](/pt-BR/plugins/building-plugins)
