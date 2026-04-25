---
read_when:
    - Você quer que um agente OpenClaw entre em uma chamada do Google Meet
    - Você quer que um agente OpenClaw crie uma nova chamada do Google Meet
    - Você está configurando Chrome, Node do Chrome ou Twilio como transporte do Google Meet
summary: 'Plugin do Google Meet: entrar em URLs explícitas do Meet por Chrome ou Twilio com padrões de voz em tempo real'
title: Plugin do Google Meet
x-i18n:
    generated_at: "2026-04-25T13:51:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3329ea25e94eb20403464d041cd34de731b7620deeac6b32248655e885cd3729
    source_path: plugins/google-meet.md
    workflow: 15
---

Suporte a participante do Google Meet para o OpenClaw — o Plugin é explícito por design:

- Ele só entra em uma URL explícita `https://meet.google.com/...`.
- Ele pode criar um novo espaço do Meet pela API do Google Meet e então entrar na
  URL retornada.
- Voz `realtime` é o modo padrão.
- A voz em tempo real pode chamar de volta o agente OpenClaw completo quando forem necessários raciocínio mais profundo ou ferramentas.
- Agentes escolhem o comportamento de entrada com `mode`: use `realtime` para
  ouvir/falar ao vivo, ou `transcribe` para entrar/controlar o navegador sem a
  bridge de voz em tempo real.
- A autenticação começa como OAuth pessoal do Google ou um perfil do Chrome já autenticado.
- Não há anúncio automático de consentimento.
- O backend de áudio padrão do Chrome é `BlackHole 2ch`.
- O Chrome pode rodar localmente ou em um host node pareado.
- O Twilio aceita um número de discagem mais PIN opcional ou sequência DTMF.
- O comando da CLI é `googlemeet`; `meet` é reservado para fluxos de trabalho mais amplos de teleconferência de agentes.

## Início rápido

Instale as dependências locais de áudio e configure um provedor de voz em tempo real de backend.
OpenAI é o padrão; Google Gemini Live também funciona com
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` instala o dispositivo virtual de áudio `BlackHole 2ch`. O instalador do Homebrew
exige uma reinicialização antes que o macOS exponha o dispositivo:

```bash
sudo reboot
```

Após reiniciar, verifique as duas partes:

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

A saída de configuração foi feita para ser legível por agentes. Ela informa perfil do Chrome,
bridge de áudio, fixação em node, introdução atrasada de realtime e, quando a delegação Twilio
está configurada, se o Plugin `voice-call` e as credenciais do Twilio estão prontos.
Trate qualquer verificação com `ok: false` como um bloqueador antes de pedir a um agente para entrar.
Use `openclaw googlemeet setup --json` para scripts ou saída legível por máquina.

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

- Criação por API: usada quando credenciais OAuth do Google Meet estão configuradas. Este é
  o caminho mais determinístico e não depende do estado da UI do navegador.
- Fallback do navegador: usado quando as credenciais OAuth estão ausentes. O OpenClaw usa o
  node do Chrome fixado, abre `https://meet.google.com/new`, espera o Google
  redirecionar para uma URL real com código de reunião e então retorna essa URL. Este caminho exige
  que o perfil do Chrome do OpenClaw no node já esteja autenticado no Google.
  A automação do navegador lida com o prompt de microfone da primeira execução do próprio Meet; esse prompt
  não é tratado como falha de login do Google.
  Fluxos de entrada e criação também tentam reutilizar uma aba Meet existente antes de abrir uma
  nova. A correspondência ignora query strings inofensivas da URL, como `authuser`, então uma
  nova tentativa do agente deve focar a reunião já aberta em vez de criar uma segunda aba no
  Chrome.

A saída do comando/ferramenta inclui um campo `source` (`api` ou `browser`) para que agentes
possam explicar qual caminho foi usado. `create` entra na nova reunião por padrão e
retorna `joined: true` mais a sessão de entrada. Para apenas gerar a URL, use
`create --no-join` na CLI ou passe `"join": false` para a ferramenta.

Ou diga a um agente: "Crie um Google Meet, entre com voz em tempo real e me envie
o link." O agente deve chamar `google_meet` com `action: "create"` e
então compartilhar o `meetingUri` retornado.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Para uma entrada apenas de observação/controle de navegador, defina `"mode": "transcribe"`. Isso
não inicia a bridge duplex do modelo em tempo real, então ele não falará de volta na
reunião.

Durante sessões em tempo real, o status de `google_meet` inclui a integridade do navegador e da bridge
de áudio, como `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, timestamps do último input/output,
contadores de bytes e estado de fechamento da bridge. Se um prompt seguro da página do Meet
aparecer, a automação do navegador o trata quando pode. Login, admissão pelo host e
prompts de permissão do navegador/SO são relatados como ação manual com um motivo e
mensagem para o agente retransmitir.

O Chrome entra como o perfil autenticado do Chrome. No Meet, escolha `BlackHole 2ch` para
o caminho de microfone/alto-falante usado pelo OpenClaw. Para áudio duplex limpo, use
dispositivos virtuais separados ou um grafo no estilo Loopback; um único dispositivo BlackHole é
suficiente para um primeiro teste smoke, mas pode gerar eco.

### Gateway local + Chrome no Parallels

Você **não** precisa de um Gateway OpenClaw completo nem de chave de API de modelo dentro de uma VM macOS
apenas para fazer a VM ser dona do Chrome. Execute o Gateway e o agente localmente, e então execute um
host node na VM. Ative o Plugin empacotado na VM uma vez para que o node
anuncie o comando do Chrome:

O que roda onde:

- Host do Gateway: Gateway OpenClaw, workspace do agente, chaves de modelo/API, provedor
  de realtime e configuração do Plugin do Google Meet.
- VM macOS no Parallels: CLI/node host do OpenClaw, Google Chrome, SoX, BlackHole 2ch
  e um perfil do Chrome autenticado no Google.
- Não necessário na VM: serviço Gateway, configuração de agente, chave OpenAI/GPT ou configuração
  de provedor de modelo.

Instale as dependências da VM:

```bash
brew install blackhole-2ch sox
```

Reinicie a VM após instalar o BlackHole para que o macOS exponha `BlackHole 2ch`:

```bash
sudo reboot
```

Após reiniciar, verifique se a VM consegue ver o dispositivo de áudio e os comandos SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Instale ou atualize o OpenClaw na VM e então ative o Plugin empacotado nela:

```bash
openclaw plugins enable google-meet
```

Inicie o host node na VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Se `<gateway-host>` for um IP de LAN e você não estiver usando TLS, o node recusará o
WebSocket em texto simples, a menos que você faça opt-in para essa rede privada confiável:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` é ambiente de processo, não uma
configuração de `openclaw.json`. `openclaw node install` a armazena no ambiente do LaunchAgent
quando ela está presente no comando de instalação.

Aprove o node a partir do host do Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirme que o Gateway vê o node e que ele anuncia tanto `googlemeet.chrome`
quanto capacidade de navegador/`browser.proxy`:

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

Para um teste smoke de um comando que cria ou reutiliza uma sessão, fala uma frase
conhecida e imprime a integridade da sessão:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante a entrada, a automação do navegador do OpenClaw preenche o nome de convidado, clica em Entrar/Pedir
para entrar e aceita a escolha "Usar microfone" da primeira execução do Meet quando esse prompt
aparece. Durante a criação de reunião apenas no navegador, ela também pode continuar além do
mesmo prompt sem microfone se o Meet não expuser o botão de usar microfone.
Se o perfil do navegador não estiver autenticado, o Meet estiver aguardando
admissão do host, o Chrome precisar de permissão de microfone/câmera ou o Meet estiver preso em um
prompt que a automação não conseguiu resolver, o resultado de join/test-speech informa
`manualActionRequired: true` com `manualActionReason` e
`manualActionMessage`. Os agentes devem parar de repetir a entrada,
informar exatamente essa mensagem mais o `browserUrl`/`browserTitle` atuais
e tentar novamente apenas depois que a ação manual no navegador for concluída.

Se `chromeNode.node` for omitido, o OpenClaw faz seleção automática apenas quando exatamente um
node conectado anuncia `googlemeet.chrome` e controle de navegador. Se
vários nodes capazes estiverem conectados, defina `chromeNode.node` para o ID do node,
nome de exibição ou IP remoto.

Verificações comuns de falha:

- `No connected Google Meet-capable node`: inicie `openclaw node run` na VM,
  aprove o pareamento e certifique-se de que `openclaw plugins enable google-meet` e
  `openclaw plugins enable browser` foram executados na VM. Confirme também que o
  host do Gateway permite ambos os comandos de node com
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: instale `blackhole-2ch`
  na VM e reinicie a VM.
- O Chrome abre, mas não consegue entrar: autentique-se no perfil do navegador dentro da VM ou
  mantenha `chrome.guestName` definido para entrada como convidado. A entrada automática como convidado usa a automação do navegador do OpenClaw pelo proxy de navegador do node; certifique-se de que a
  configuração do navegador do node aponte para o perfil desejado, por exemplo
  `browser.defaultProfile: "user"` ou um perfil nomeado de sessão existente.
- Abas duplicadas do Meet: mantenha `chrome.reuseExistingTab: true` ativado. O OpenClaw
  ativa uma aba existente para a mesma URL do Meet antes de abrir uma nova, e a criação de reunião no navegador reutiliza uma aba em andamento de `https://meet.google.com/new`
  ou de prompt de conta Google antes de abrir outra.
- Sem áudio: no Meet, roteie microfone/alto-falante pelo caminho do dispositivo virtual de áudio
  usado pelo OpenClaw; use dispositivos virtuais separados ou roteamento no estilo Loopback
  para áudio duplex limpo.

## Observações de instalação

O padrão realtime do Chrome usa duas ferramentas externas:

- `sox`: utilitário de áudio de linha de comando. O Plugin usa seus comandos `rec` e `play`
  para a bridge de áudio padrão de 8 kHz G.711 mu-law.
- `blackhole-2ch`: driver virtual de áudio do macOS. Ele cria o dispositivo de áudio
  `BlackHole 2ch` pelo qual o Chrome/Meet pode ser roteado.

O OpenClaw não empacota nem redistribui nenhum dos dois pacotes. A documentação pede aos usuários que
os instalem como dependências do host pelo Homebrew. O SoX é licenciado como
`LGPL-2.0-only AND GPL-2.0-only`; o BlackHole é GPL-3.0. Se você criar um
instalador ou appliance que empacote o BlackHole com o OpenClaw, revise os
termos de licenciamento upstream do BlackHole ou obtenha uma licença separada da Existential Audio.

## Transportes

### Chrome

O transporte Chrome abre a URL do Meet no Google Chrome e entra como o perfil autenticado
do Chrome. No macOS, o Plugin verifica `BlackHole 2ch` antes da inicialização.
Se configurado, ele também executa um comando de integridade da bridge de áudio e um comando de inicialização
antes de abrir o Chrome. Use `chrome` quando Chrome/áudio estiverem no host do Gateway;
use `chrome-node` quando Chrome/áudio estiverem em um node pareado, como uma VM macOS no Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Roteie o áudio de microfone e alto-falante do Chrome pela bridge de áudio local do OpenClaw.
Se `BlackHole 2ch` não estiver instalado, a entrada falha com um erro de configuração
em vez de entrar silenciosamente sem um caminho de áudio.

### Twilio

O transporte Twilio é um plano de discagem estrito delegado ao Plugin Voice Call. Ele
não analisa páginas do Meet em busca de números de telefone.

Use isso quando a participação por Chrome não estiver disponível ou quando você quiser um
fallback de discagem por telefone. O Google Meet precisa expor um número de discagem por telefone e PIN para a
reunião; o OpenClaw não descobre isso a partir da página do Meet.

Ative o Plugin Voice Call no host do Gateway, não no node do Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // ou defina "twilio" se o Twilio deve ser o padrão
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

Forneça as credenciais do Twilio por ambiente ou configuração. O ambiente mantém
segredos fora de `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Reinicie ou recarregue o Gateway após ativar `voice-call`; mudanças de configuração de Plugin
não aparecem em um processo do Gateway já em execução até que ele seja recarregado.

Depois verifique:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Quando a delegação do Twilio estiver conectada, `googlemeet setup` incluirá verificações bem-sucedidas de
`twilio-voice-call-plugin` e `twilio-voice-call-credentials`.

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
à automação do navegador. Configure OAuth quando quiser criação oficial por API,
resolução de espaço ou verificações de preflight da API de mídia do Meet.

O acesso à API do Google Meet usa OAuth de usuário: crie um cliente OAuth no Google Cloud,
solicite os escopos necessários, autorize uma conta Google e então armazene o
refresh token resultante na configuração do Plugin Google Meet ou forneça as
variáveis de ambiente `OPENCLAW_GOOGLE_MEET_*`.

OAuth não substitui o caminho de entrada pelo Chrome. Os transportes Chrome e Chrome-node
ainda entram por um perfil autenticado do Chrome, BlackHole/SoX e um node conectado
quando você usa participação por navegador. OAuth é apenas para o caminho oficial da
API do Google Meet: criar espaços de reunião, resolver espaços e executar verificações de preflight da API de mídia do Meet.

### Criar credenciais Google

No Google Cloud Console:

1. Crie ou selecione um projeto do Google Cloud.
2. Ative a **Google Meet REST API** para esse projeto.
3. Configure a tela de consentimento OAuth.
   - **Internal** é o mais simples para uma organização Google Workspace.
   - **External** funciona para configurações pessoais/de teste; enquanto o app estiver em Testing,
     adicione como usuário de teste cada conta Google que autorizará o app.
4. Adicione os escopos que o OpenClaw solicita:
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

`meetings.space.created` é exigido por `spaces.create` do Google Meet.
`meetings.space.readonly` permite que o OpenClaw resolva URLs/códigos do Meet para espaços.
`meetings.conference.media.readonly` é para preflight da API de mídia do Meet e trabalho com mídia;
o Google pode exigir inscrição no Developer Preview para uso real da API de mídia.
Se você só precisa de entradas no Chrome baseadas em navegador, ignore OAuth totalmente.

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

Prefira variáveis de ambiente quando não quiser o refresh token na configuração.
Se houver valores tanto na configuração quanto no ambiente, o Plugin resolve primeiro a configuração
e depois usa fallback para o ambiente.

O consentimento OAuth inclui criação de espaço do Meet, acesso de leitura a espaço do Meet e acesso de leitura a mídia de conferência do Meet. Se você se autenticou antes de existir suporte a criação
de reunião, execute `openclaw googlemeet auth login --json` novamente para que o refresh
token tenha o escopo `meetings.space.created`.

### Verificar OAuth com doctor

Execute o doctor de OAuth quando quiser uma verificação rápida de integridade sem segredos:

```bash
openclaw googlemeet doctor --oauth --json
```

Isso não carrega o runtime do Chrome nem exige um node do Chrome conectado. Ele
verifica se existe configuração OAuth e se o refresh token consegue gerar um access
token. O relatório JSON inclui apenas campos de status como `ok`, `configured`,
`tokenSource`, `expiresAt` e mensagens de verificação; ele não imprime access
token, refresh token nem segredo do cliente.

Resultados comuns:

| Verificação          | Significado                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` mais `oauth.refreshToken`, ou um access token em cache, está presente. |
| `oauth-token`        | O access token em cache ainda é válido, ou o refresh token gerou um novo access token. |
| `meet-spaces-get`    | A verificação opcional `--meeting` resolveu um espaço Meet existente.                  |
| `meet-spaces-create` | A verificação opcional `--create-space` criou um novo espaço Meet.                     |

Para também comprovar ativação da API do Google Meet e o escopo `spaces.create`, execute a
verificação de criação com efeito colateral:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` cria uma URL descartável do Meet. Use isso quando precisar confirmar
que o projeto do Google Cloud tem a API do Meet ativada e que a conta autorizada tem o escopo `meetings.space.created`.

Para comprovar acesso de leitura a um espaço de reunião existente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` e `resolve-space` comprovam acesso de leitura a um espaço
existente que a conta Google autorizada pode acessar. Um `403` nessas verificações
geralmente significa que a Google Meet REST API está desativada, que o refresh token com consentimento
não tem o escopo necessário ou que a conta Google não pode acessar aquele
espaço do Meet. Um erro de refresh token significa executar novamente `openclaw googlemeet auth login
--json` e armazenar o novo bloco `oauth`.

Nenhuma credencial OAuth é necessária para o fallback do navegador. Nesse modo, a autenticação Google
vem do perfil autenticado do Chrome no node selecionado, não da
configuração do OpenClaw.

Estas variáveis de ambiente são aceitas como fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` ou `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ou `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ou
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` ou `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` ou `GOOGLE_MEET_PREVIEW_ACK`

Resolva uma URL, código ou `spaces/{id}` do Meet via `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Execute o preflight antes do trabalho com mídia:

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

A busca no calendário pode resolver a URL da reunião a partir do Google Calendar antes de ler
artefatos do Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` procura no calendário `primary` de hoje por um evento do Calendar com um
link do Google Meet. Use `--event <query>` para pesquisar texto correspondente do evento, e
`--calendar <id>` para um calendário não primário. A busca no calendário exige um
novo login OAuth que inclua o escopo readonly de eventos do Calendar.
`calendar-events` mostra uma prévia dos eventos Meet correspondentes e marca o evento que
`latest`, `artifacts`, `attendance` ou `export` escolherá.

Se você já souber o ID do registro de conferência, direcione-o diretamente:

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

`artifacts` retorna metadados do registro da conferência, além de metadados de recursos de participantes,
gravações, transcrição, entradas estruturadas de transcrição e smart notes quando o
Google os expõe para a reunião. Use `--no-transcript-entries` para ignorar
a busca de entradas em reuniões grandes. `attendance` expande participantes em
linhas de sessão de participante com horários de primeira/última presença, duração total da sessão,
sinalizadores de atraso/saída antecipada e recursos duplicados de participante mesclados por
usuário autenticado ou nome de exibição. Passe `--no-merge-duplicates` para manter recursos brutos de participante
separados, `--late-after-minutes` para ajustar a detecção de atraso e
`--early-before-minutes` para ajustar a detecção de saída antecipada.

`export` grava uma pasta contendo `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` e `manifest.json`.
`manifest.json` registra a entrada escolhida, opções de exportação, registros de conferência,
arquivos de saída, contagens, origem do token, evento do Calendar quando um foi usado
e quaisquer avisos de recuperação parcial. Passe `--zip` para também gravar um
arquivo portátil ao lado da pasta. Passe `--include-doc-bodies` para exportar
texto de Google Docs vinculado de transcrição e smart notes por meio de `files.export` do Google Drive; isso exige um
novo login OAuth que inclua o escopo readonly do Drive Meet. Sem
`--include-doc-bodies`, as exportações incluem apenas metadados do Meet e entradas estruturadas
de transcrição. Se o Google retornar uma falha parcial de artefato, como um erro de
listagem de smart notes, entrada de transcrição ou corpo de documento do Drive, o resumo e
o manifesto mantêm o aviso em vez de falhar toda a exportação.
Use `--dry-run` para buscar os mesmos dados de artefatos/presença e imprimir o
JSON do manifesto sem criar a pasta nem o ZIP. Isso é útil antes de gravar
uma exportação grande ou quando um agente precisa apenas de contagens, registros
selecionados e avisos.

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

Defina `"dryRun": true` para retornar apenas o manifesto de exportação e ignorar gravações de arquivo.

Execute o teste smoke ao vivo protegido contra uma reunião real retida:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Ambiente do teste smoke ao vivo:

- `OPENCLAW_LIVE_TEST=1` ativa testes ao vivo protegidos.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` aponta para uma URL, código ou
  `spaces/{id}` de Meet retido.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID` fornece o
  ID do cliente OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN` fornece
  o refresh token.
- Opcional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` e
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` usam os mesmos nomes de fallback
  sem o prefixo `OPENCLAW_`.

O teste smoke ao vivo básico de artefatos/presença exige
`https://www.googleapis.com/auth/meetings.space.readonly` e
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. A busca no Calendar
exige `https://www.googleapis.com/auth/calendar.events.readonly`. Exportação de corpo de documento do Drive exige
`https://www.googleapis.com/auth/drive.meet.readonly`.

Crie um novo espaço Meet:

```bash
openclaw googlemeet create
```

O comando imprime a nova `meeting uri`, a origem e a sessão de entrada. Com credenciais
OAuth, ele usa a API oficial do Google Meet. Sem credenciais OAuth, ele
usa como fallback o perfil autenticado do navegador do node do Chrome fixado. Agentes podem
usar a ferramenta `google_meet` com `action: "create"` para criar e entrar em uma única
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

Se o fallback do navegador encontrar um bloqueador de login do Google ou de permissão do Meet antes de
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

Quando um agente vê `manualActionRequired: true`, ele deve informar a
`manualActionMessage` mais o contexto do node/aba do navegador e parar de abrir novas
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

A criação de um Meet entra na reunião por padrão. O transporte Chrome ou Chrome-node ainda
precisa de um perfil autenticado do Google Chrome para entrar pelo navegador. Se o
perfil estiver desconectado, o OpenClaw informa `manualActionRequired: true` ou um
erro de fallback do navegador e pede ao operador para concluir o login do Google antes de
tentar novamente.

Defina `preview.enrollmentAcknowledged: true` somente após confirmar que seu projeto Cloud,
principal OAuth e participantes da reunião estão inscritos no Google
Workspace Developer Preview Program para APIs de mídia do Meet.

## Configuração

O caminho comum de realtime pelo Chrome só precisa do Plugin ativado, BlackHole, SoX
e uma chave de provedor de voz em tempo real de backend. OpenAI é o padrão; defina
`realtime.provider: "google"` para usar Google Gemini Live:

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
- `chromeNode.node`: ID/nome/IP opcional do node para `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nome usado na tela de convidado
  desconectado do Meet
- `chrome.autoJoin: true`: preenchimento best-effort do nome de convidado e clique em Entrar agora
  por meio da automação de navegador do OpenClaw em `chrome-node`
- `chrome.reuseExistingTab: true`: ativa uma aba existente do Meet em vez de
  abrir duplicatas
- `chrome.waitForInCallMs: 20000`: espera a aba do Meet informar que está em chamada
  antes de a introdução de realtime ser disparada
- `chrome.audioInputCommand`: comando `rec` do SoX gravando áudio G.711 mu-law de 8 kHz
  para stdout
- `chrome.audioOutputCommand`: comando `play` do SoX lendo áudio G.711 mu-law de 8 kHz
  de stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: respostas faladas curtas, com
  `openclaw_agent_consult` para respostas mais profundas
- `realtime.introMessage`: verificação curta falada de prontidão quando a bridge de realtime
  se conecta; defina como `""` para entrar em silêncio

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

`voiceCall.enabled` usa `true` por padrão; com transporte Twilio ele delega a
chamada PSTN real e DTMF ao Plugin Voice Call. Se `voice-call` não estiver
ativado, o Google Meet ainda poderá validar e registrar o plano de discagem, mas não
conseguirá fazer a chamada Twilio.

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

Use `transport: "chrome"` quando o Chrome rodar no host do Gateway. Use
`transport: "chrome-node"` quando o Chrome rodar em um node pareado, como uma VM no Parallels.
Em ambos os casos, o modelo de realtime e `openclaw_agent_consult` rodam no
host do Gateway, então as credenciais do modelo permanecem lá.

Use `action: "status"` para listar sessões ativas ou inspecionar um ID de sessão. Use
`action: "speak"` com `sessionId` e `message` para fazer o agente de realtime
falar imediatamente. Use `action: "test_speech"` para criar ou reutilizar a sessão,
disparar uma frase conhecida e retornar a integridade `inCall` quando o host do Chrome puder
informá-la. Use `action: "leave"` para marcar uma sessão como encerrada.

`status` inclui a integridade do Chrome quando disponível:

- `inCall`: o Chrome parece estar dentro da chamada do Meet
- `micMuted`: estado best-effort do microfone no Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: o
  perfil do navegador precisa de login manual, admissão do host no Meet, permissões ou
  reparo de controle do navegador antes que a fala funcione
- `providerConnected` / `realtimeReady`: estado da bridge de voz em tempo real
- `lastInputAt` / `lastOutputAt`: último áudio visto da bridge ou enviado para ela

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Consulta ao agente em realtime

O modo de realtime do Chrome é otimizado para um loop de voz ao vivo. O provedor
de voz em tempo real ouve o áudio da reunião e fala pela bridge de áudio configurada.
Quando o modelo de realtime precisa de raciocínio mais profundo, informações atuais ou ferramentas normais
do OpenClaw, ele pode chamar `openclaw_agent_consult`.

A ferramenta de consulta executa o agente regular do OpenClaw nos bastidores com contexto recente
da transcrição da reunião e retorna uma resposta falada concisa para a sessão de voz em tempo real. O modelo de voz pode então falar essa resposta de volta na reunião.
Ela usa a mesma ferramenta compartilhada de consulta em realtime do Voice Call.

`realtime.toolPolicy` controla a execução da consulta:

- `safe-read-only`: expõe a ferramenta de consulta e limita o agente regular a
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e
  `memory_get`.
- `owner`: expõe a ferramenta de consulta e deixa o agente regular usar a política normal de ferramentas do agente.
- `none`: não expõe a ferramenta de consulta ao modelo de voz em tempo real.

A chave de sessão da consulta é delimitada por sessão do Meet, então chamadas de consulta subsequentes
podem reutilizar contexto anterior de consulta durante a mesma reunião.

Para forçar uma verificação falada de prontidão depois que o Chrome entrar totalmente na chamada:

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

Use esta sequência antes de entregar uma reunião a um agente sem supervisão:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Estado esperado de `chrome-node`:

- `googlemeet setup` está totalmente verde.
- `googlemeet setup` inclui `chrome-node-connected` quando `chrome-node` é o
  transporte padrão ou quando um node está fixado.
- `nodes status` mostra o node selecionado como conectado.
- O node selecionado anuncia tanto `googlemeet.chrome` quanto `browser.proxy`.
- A aba do Meet entra na chamada e `test-speech` retorna a integridade do Chrome com
  `inCall: true`.

Para um host remoto de Chrome, como uma VM macOS no Parallels, esta é a verificação segura
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
- `voicecall` está disponível na CLI após o recarregamento do Gateway.
- A sessão retornada tem `transport: "twilio"` e um `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` desliga a chamada de voz delegada.

## Solução de problemas

### O agente não consegue ver a ferramenta Google Meet

Confirme que o Plugin está ativado na configuração do Gateway e recarregue o Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Se você acabou de editar `plugins.entries.google-meet`, reinicie ou recarregue o Gateway.
O agente em execução só vê ferramentas de Plugin registradas pelo processo atual do Gateway.

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

Se `googlemeet setup` falhar em `chrome-node-connected` ou se o log do Gateway informar
`gateway token mismatch`, reinstale ou reinicie o node com o token atual do Gateway.
Para um Gateway em LAN, isso normalmente significa:

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
informar `manualActionRequired: true`, mostre `manualActionMessage` ao operador
e pare de tentar novamente até que a ação no navegador seja concluída.

Ações manuais comuns:

- Fazer login no perfil do Chrome.
- Admitir o convidado pela conta host do Meet.
- Conceder permissões de microfone/câmera ao Chrome quando o prompt nativo de permissão
  do Chrome aparecer.
- Fechar ou reparar uma caixa de diálogo travada de permissão do Meet.

Não informe "não autenticado" só porque o Meet mostra "Do you want people to
hear you in the meeting?" Esse é o intersticial de escolha de áudio do Meet; o OpenClaw
clica em **Use microphone** por automação do navegador quando disponível e continua
aguardando o estado real da reunião. Para fallback de criação apenas no navegador, o OpenClaw
pode clicar em **Continue without microphone** porque a criação da URL não precisa
do caminho de áudio em tempo real.

### A criação da reunião falha

`googlemeet create` primeiro usa o endpoint `spaces.create` da API do Google Meet
quando credenciais OAuth estão configuradas. Sem credenciais OAuth, ele recorre
ao navegador do node do Chrome fixado. Confirme:

- Para criação por API: `oauth.clientId` e `oauth.refreshToken` estão configurados,
  ou existem variáveis de ambiente `OPENCLAW_GOOGLE_MEET_*` correspondentes.
- Para criação por API: o refresh token foi gerado depois que o suporte à criação foi
  adicionado. Tokens mais antigos podem não ter o escopo `meetings.space.created`; execute novamente
  `openclaw googlemeet auth login --json` e atualize a configuração do Plugin.
- Para fallback do navegador: `defaultTransport: "chrome-node"` e
  `chromeNode.node` apontam para um node conectado com `browser.proxy` e
  `googlemeet.chrome`.
- Para fallback do navegador: o perfil do Chrome do OpenClaw nesse node está autenticado
  no Google e consegue abrir `https://meet.google.com/new`.
- Para fallback do navegador: novas tentativas reutilizam uma aba existente de `https://meet.google.com/new`
  ou de prompt de conta do Google antes de abrir uma nova aba. Se um agente expirar por timeout,
  tente novamente a chamada da ferramenta em vez de abrir manualmente outra aba do Meet.
- Para fallback do navegador: se a ferramenta retornar `manualActionRequired: true`, use
  `browser.nodeId`, `browser.targetId`, `browserUrl` e
  `manualActionMessage` retornados para orientar o operador. Não tente novamente em loop até que essa
  ação esteja concluída.
- Para fallback do navegador: se o Meet mostrar "Do you want people to hear you in the
  meeting?", deixe a aba aberta. O OpenClaw deve clicar em **Use microphone** ou, para
  fallback apenas de criação, **Continue without microphone** por automação do navegador
  e continuar aguardando a URL gerada do Meet. Se não conseguir, o
  erro deve mencionar `meet-audio-choice-required`, não `google-login-required`.

### O agente entra, mas não fala

Verifique o caminho de realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Use `mode: "realtime"` para ouvir/falar de volta. `mode: "transcribe"` intencionalmente
não inicia a bridge duplex de voz em tempo real.

Verifique também:

- Há uma chave de provedor de realtime disponível no host do Gateway, como
  `OPENAI_API_KEY` ou `GEMINI_API_KEY`.
- `BlackHole 2ch` está visível no host do Chrome.
- `rec` e `play` existem no host do Chrome.
- O microfone e o alto-falante do Meet estão roteados pelo caminho virtual de áudio usado pelo
  OpenClaw.

`googlemeet doctor [session-id]` imprime a sessão, node, estado in-call,
motivo de ação manual, conexão do provedor de realtime, `realtimeReady`, atividade de
entrada/saída de áudio, timestamps do último áudio, contadores de bytes e URL do navegador.
Use `googlemeet status [session-id]` quando precisar do JSON bruto. Use
`googlemeet doctor --oauth` quando precisar verificar o refresh do OAuth do Google Meet
sem expor tokens; adicione `--meeting` ou `--create-space` quando também precisar de uma prova da API do Google Meet.

Se um agente expirou por timeout e você consegue ver uma aba do Meet já aberta, inspecione essa aba
sem abrir outra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

A ação de ferramenta equivalente é `recover_current_tab`. Ela foca e inspeciona uma
aba existente do Meet no node do Chrome configurado. Ela não abre uma nova aba nem
cria uma nova sessão; ela informa o bloqueador atual, como login, admissão,
permissões ou estado de escolha de áudio. O comando da CLI fala com o Gateway configurado,
então o Gateway precisa estar em execução e o node do Chrome precisa estar conectado.

### As verificações de configuração do Twilio falham

`twilio-voice-call-plugin` falha quando `voice-call` não é permitido ou não está ativado.
Adicione-o a `plugins.allow`, ative `plugins.entries.voice-call` e recarregue o
Gateway.

`twilio-voice-call-credentials` falha quando o backend do Twilio não tem account
SID, auth token ou número do chamador. Defina estes itens no host do Gateway:

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

`voicecall smoke` é apenas de prontidão por padrão. Para um dry-run em um número específico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Adicione `--yes` apenas quando quiser intencionalmente fazer uma chamada real
de notificação de saída:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### A chamada Twilio começa, mas nunca entra na reunião

Confirme que o evento do Meet expõe detalhes de discagem por telefone. Passe exatamente o número de
discagem e o PIN ou uma sequência DTMF personalizada:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Use `w` inicial ou vírgulas em `--dtmf-sequence` se o provedor precisar de uma pausa
antes de digitar o PIN.

## Observações

A API oficial de mídia do Google Meet é orientada a recebimento, então falar em uma chamada do Meet
ainda exige um caminho de participante. Este Plugin mantém esse limite visível:
o Chrome cuida da participação pelo navegador e do roteamento local de áudio; o Twilio cuida
da participação por discagem telefônica.

O modo de realtime do Chrome precisa de um destes:

- `chrome.audioInputCommand` mais `chrome.audioOutputCommand`: o OpenClaw controla a
  bridge do modelo em tempo real e canaliza áudio G.711 mu-law de 8 kHz entre esses
  comandos e o provedor de voz em tempo real selecionado.
- `chrome.audioBridgeCommand`: um comando de bridge externa controla todo o caminho local
  de áudio e deve sair após iniciar ou validar seu daemon.

Para áudio duplex limpo, roteie a saída do Meet e o microfone do Meet por
dispositivos virtuais separados ou por um grafo de dispositivo virtual no estilo Loopback. Um único dispositivo compartilhado
BlackHole pode ecoar outros participantes de volta para a chamada.

`googlemeet speak` aciona a bridge de áudio em tempo real ativa para uma
sessão Chrome. `googlemeet leave` interrompe essa bridge. Para sessões Twilio delegadas
pelo Plugin Voice Call, `leave` também desliga a chamada de voz subjacente.

## Relacionado

- [Voice call plugin](/pt-BR/plugins/voice-call)
- [Talk mode](/pt-BR/nodes/talk)
- [Building plugins](/pt-BR/plugins/building-plugins)
