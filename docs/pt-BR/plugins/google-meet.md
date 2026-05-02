---
read_when:
    - Você quer que um agente do OpenClaw participe de uma chamada do Google Meet
    - Você quer que um agente do OpenClaw crie uma nova chamada do Google Meet
    - Você está configurando Chrome, nó do Chrome ou Twilio como transporte do Google Meet
summary: 'Plugin do Google Meet: entre em URLs explícitas do Meet pelo Chrome ou pela Twilio com padrões de voz em tempo real'
title: Plugin do Google Meet
x-i18n:
    generated_at: "2026-05-02T05:52:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: af1f327249c45fe318410a15c598fa9aff52bd160961b6354f027cb728b7aa82
    source_path: plugins/google-meet.md
    workflow: 16
---

Suporte de participantes do Google Meet para OpenClaw — o plugin é explícito por design:

- Ele só entra em uma URL explícita `https://meet.google.com/...`.
- Ele pode criar um novo espaço do Meet pela API do Google Meet e, depois, entrar na
  URL retornada.
- `realtime` voice é o modo padrão.
- O voice em tempo real pode chamar de volta o agente OpenClaw completo quando
  raciocínio mais profundo ou ferramentas forem necessários.
- Os agentes escolhem o comportamento de entrada com `mode`: use `realtime` para
  escuta/resposta ao vivo, ou `transcribe` para entrar/controlar o navegador sem a
  ponte de voice em tempo real.
- A autenticação começa como OAuth pessoal do Google ou um perfil do Chrome já autenticado.
- Não há anúncio automático de consentimento.
- O backend de áudio padrão do Chrome é `BlackHole 2ch`.
- O Chrome pode rodar localmente ou em um host de node pareado.
- O Twilio aceita um número de discagem mais PIN ou sequência DTMF opcional.
- O comando da CLI é `googlemeet`; `meet` fica reservado para fluxos mais amplos de
  teleconferência de agentes.

## Início rápido

Instale as dependências locais de áudio e configure um provedor de voice em tempo real
de backend. OpenAI é o padrão; Google Gemini Live também funciona com
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

Depois da reinicialização, verifique as duas partes:

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

A saída de configuração foi feita para ser legível por agentes e ciente do modo. Ela relata o perfil do Chrome,
a fixação de node e, para entradas no Chrome em tempo real, a ponte de áudio BlackHole/SoX
e as verificações atrasadas de introdução em tempo real. Para entradas somente de observação, verifique o mesmo
transporte com `--mode transcribe`; esse modo ignora os pré-requisitos de áudio em tempo real
porque não escuta nem fala pela ponte:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Quando a delegação via Twilio está configurada, a configuração também relata se o plugin
`voice-call`, as credenciais do Twilio e a exposição pública do webhook estão prontos.
Trate qualquer verificação `ok: false` como um bloqueador para o transporte e modo verificados
antes de pedir que um agente entre. Use `openclaw googlemeet setup --json` para
scripts ou saída legível por máquina. Use `--transport chrome`,
`--transport chrome-node` ou `--transport twilio` para fazer o preflight de um transporte específico
antes que um agente tente usá-lo.

Para Twilio, sempre faça o preflight do transporte explicitamente quando o transporte padrão
for Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Isso detecta fiação ausente do `voice-call`, credenciais do Twilio ou exposição de webhook
inalcançável antes que o agente tente discar para a reunião.

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

Crie somente a URL sem entrar:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` tem dois caminhos:

- Criação por API: usada quando credenciais OAuth do Google Meet estão configuradas. Este é
  o caminho mais determinístico e não depende do estado da UI do navegador.
- Fallback do navegador: usado quando as credenciais OAuth estão ausentes. OpenClaw usa o
  node do Chrome fixado, abre `https://meet.google.com/new`, aguarda o Google
  redirecionar para uma URL real com código de reunião e então retorna essa URL. Esse caminho exige
  que o perfil do Chrome do OpenClaw no node já esteja autenticado no Google.
  A automação do navegador lida com o próprio prompt de microfone de primeira execução do Meet; esse prompt
  não é tratado como falha de login do Google.
  Os fluxos de entrada e criação também tentam reutilizar uma aba existente do Meet antes de abrir uma
  nova. A correspondência ignora strings de consulta inofensivas da URL, como `authuser`, então uma
  nova tentativa do agente deve focar a reunião já aberta em vez de criar uma segunda
  aba do Chrome.

A saída do comando/ferramenta inclui um campo `source` (`api` ou `browser`) para que os agentes
possam explicar qual caminho foi usado. `create` entra na nova reunião por padrão e
retorna `joined: true` mais a sessão de entrada. Para apenas emitir a URL, use
`create --no-join` na CLI ou passe `"join": false` para a ferramenta.

Ou diga a um agente: "Crie um Google Meet, entre nele com voice em tempo real e me envie
o link." O agente deve chamar `google_meet` com `action: "create"` e
depois compartilhar o `meetingUri` retornado.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Para uma entrada somente de observação/controle do navegador, defina `"mode": "transcribe"`. Isso
não inicia a ponte duplex do modelo em tempo real, não exige BlackHole nem SoX
e não responderá com fala na reunião. Entradas do Chrome nesse modo também evitam
a concessão de permissão de microfone/câmera do OpenClaw e evitam o caminho **Use
microphone** do Meet. Se o Meet mostrar um intersticial de escolha de áudio, a automação tenta
o caminho sem microfone e, caso contrário, relata uma ação manual em vez de abrir
o microfone local. No modo transcribe, transportes gerenciados do Chrome também instalam
um observador de legendas do Meet em melhor esforço. `googlemeet status --json` e
`googlemeet doctor` expõem `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`
e uma cauda curta de `recentTranscript` para que operadores possam saber se o navegador
entrou na chamada e se as legendas do Meet estão produzindo texto.

Durante sessões em tempo real, o status de `google_meet` inclui a integridade do navegador e da ponte de áudio,
como `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, últimos timestamps de entrada/saída,
contadores de bytes e estado fechado da ponte. Se um prompt seguro de página do Meet
aparecer, a automação do navegador lida com ele quando consegue. Login, admissão pelo host e
prompts de permissão do navegador/SO são relatados como ação manual com um motivo e
mensagem para o agente repassar. Sessões gerenciadas do Chrome só emitem a introdução ou
frase de teste depois que a integridade do navegador relata `inCall: true`; caso contrário, o status relata
`speechReady: false` e a tentativa de fala é bloqueada em vez de fingir que o
agente falou na reunião.

Entradas locais do Chrome usam o perfil de navegador autenticado do OpenClaw. O modo em tempo real
exige `BlackHole 2ch` para o caminho de microfone/alto-falante usado pelo OpenClaw. Para
áudio duplex limpo, use dispositivos virtuais separados ou um grafo no estilo Loopback; um
único dispositivo BlackHole é suficiente para um primeiro smoke test, mas pode gerar eco.

### Gateway local + Chrome no Parallels

Você **não** precisa de um Gateway OpenClaw completo nem de uma chave de API de modelo dentro de uma VM macOS
apenas para fazer a VM assumir o Chrome. Rode o Gateway e o agente localmente e, depois, rode um
host de node na VM. Habilite o plugin incluído na VM uma vez para que o node
anuncie o comando do Chrome:

O que roda onde:

- Host do Gateway: OpenClaw Gateway, workspace do agente, chaves de modelo/API, provedor em tempo real
  e a configuração do plugin Google Meet.
- VM macOS no Parallels: CLI/host de node do OpenClaw, Google Chrome, SoX, BlackHole 2ch
  e um perfil do Chrome autenticado no Google.
- Não necessário na VM: serviço Gateway, configuração de agente, chave OpenAI/GPT ou configuração de
  provedor de modelo.

Instale as dependências da VM:

```bash
brew install blackhole-2ch sox
```

Reinicie a VM depois de instalar o BlackHole para que o macOS exponha `BlackHole 2ch`:

```bash
sudo reboot
```

Depois da reinicialização, verifique se a VM consegue ver o dispositivo de áudio e os comandos SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Instale ou atualize o OpenClaw na VM e, então, habilite o plugin incluído ali:

```bash
openclaw plugins enable google-meet
```

Inicie o host de node na VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Se `<gateway-host>` for um IP de LAN e você não estiver usando TLS, o node recusará o
WebSocket em texto claro, a menos que você opte por essa rede privada confiável:

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

Para um smoke test de um comando que cria ou reutiliza uma sessão, fala uma frase conhecida
e imprime a integridade da sessão:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante a entrada em tempo real, a automação de navegador do OpenClaw preenche o nome de convidado, clica em
Entrar/Pedir para entrar e aceita a escolha "Use microphone" de primeira execução do Meet quando esse
prompt aparece. Durante entrada somente de observação ou criação de reunião somente pelo navegador, ela
prossegue além do mesmo prompt sem microfone quando essa escolha está disponível.
Se o perfil do navegador não estiver autenticado, o Meet estiver aguardando admissão do host,
o Chrome precisar de permissão de microfone/câmera para uma entrada em tempo real, ou o Meet estiver preso
em um prompt que a automação não conseguiu resolver, o resultado de join/test-speech relata
`manualActionRequired: true` com `manualActionReason` e
`manualActionMessage`. Os agentes devem parar de tentar entrar novamente, relatar essa mensagem exata
mais o `browserUrl`/`browserTitle` atual e tentar novamente somente depois que a
ação manual no navegador estiver concluída.

Se `chromeNode.node` for omitido, OpenClaw seleciona automaticamente apenas quando exatamente um
node conectado anuncia tanto `googlemeet.chrome` quanto controle de navegador. Se
vários nodes capazes estiverem conectados, defina `chromeNode.node` para o id do node,
nome de exibição ou IP remoto.

Verificações comuns de falha:

- `Configured Google Meet node ... is not usable: offline`: o nó fixado é
  conhecido pelo Gateway, mas está indisponível. Agentes devem tratar esse nó como
  estado de diagnóstico, não como um host Chrome utilizável, e relatar o bloqueador de configuração
  em vez de recorrer a outro transporte, a menos que o usuário tenha pedido isso.
- `No connected Google Meet-capable node`: inicie `openclaw node run` na VM,
  aprove o pareamento e certifique-se de que `openclaw plugins enable google-meet` e
  `openclaw plugins enable browser` foram executados na VM. Confirme também que o
  host do Gateway permite ambos os comandos de nó com
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: instale `blackhole-2ch` no host
  sendo verificado e reinicie antes de usar o áudio local do Chrome.
- `BlackHole 2ch audio device not found on the node`: instale `blackhole-2ch`
  na VM e reinicie a VM.
- O Chrome abre, mas não consegue entrar: faça login no perfil do navegador dentro da VM, ou
  mantenha `chrome.guestName` definido para entrada como convidado. A entrada automática como convidado usa a automação de navegador do OpenClaw
  pelo proxy de navegador do nó; certifique-se de que a configuração de navegador do nó
  aponte para o perfil desejado, por exemplo
  `browser.defaultProfile: "user"` ou um perfil de sessão existente nomeado.
- Abas duplicadas do Meet: mantenha `chrome.reuseExistingTab: true` habilitado. O OpenClaw
  ativa uma aba existente para a mesma URL do Meet antes de abrir uma nova, e
  a criação de reunião pelo navegador reutiliza uma aba em andamento de `https://meet.google.com/new`
  ou de prompt de conta Google antes de abrir outra.
- Sem áudio: no Meet, direcione microfone/alto-falante pelo caminho do dispositivo de áudio virtual
  usado pelo OpenClaw; use dispositivos virtuais separados ou roteamento no estilo Loopback
  para áudio duplex limpo.

## Notas de instalação

O padrão em tempo real do Chrome usa duas ferramentas externas:

- `sox`: utilitário de áudio de linha de comando. O plugin usa comandos explícitos de dispositivo CoreAudio
  para a ponte de áudio PCM16 padrão de 24 kHz.
- `blackhole-2ch`: driver de áudio virtual do macOS. Ele cria o dispositivo de áudio `BlackHole 2ch`
  pelo qual Chrome/Meet podem rotear.

O OpenClaw não empacota nem redistribui nenhum dos pacotes. A documentação pede que os usuários
os instalem como dependências do host pelo Homebrew. SoX é licenciado como
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole é GPL-3.0. Se você criar um
instalador ou appliance que empacote BlackHole com OpenClaw, revise os termos de licenciamento
upstream do BlackHole ou obtenha uma licença separada da Existential Audio.

## Transportes

### Chrome

O transporte Chrome abre a URL do Meet pelo controle de navegador do OpenClaw e entra
como o perfil de navegador do OpenClaw autenticado. No macOS, o plugin verifica a presença de
`BlackHole 2ch` antes de iniciar. Se configurado, ele também executa um comando de integridade da ponte de áudio
e um comando de inicialização antes de abrir o Chrome. Use `chrome` quando
Chrome/áudio estiverem no host do Gateway; use `chrome-node` quando Chrome/áudio estiverem
em um nó pareado, como uma VM macOS do Parallels. Para Chrome local, escolha o
perfil com `browser.defaultProfile`; `chrome.browserProfile` é passado para
hosts `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Direcione o áudio do microfone e do alto-falante do Chrome pela ponte de áudio local do OpenClaw.
Se `BlackHole 2ch` não estiver instalado, a entrada falha com um erro de configuração
em vez de entrar silenciosamente sem um caminho de áudio.

### Twilio

O transporte Twilio é um plano de discagem estrito delegado ao plugin Voice Call. Ele
não analisa páginas do Meet em busca de números de telefone.

Use isso quando a participação pelo Chrome não estiver disponível ou quando você quiser uma alternativa
de discagem por telefone. O Google Meet deve expor um número de discagem telefônica e PIN para a
reunião; o OpenClaw não descobre esses dados pela página do Meet.

Habilite o plugin Voice Call no host do Gateway, não no nó Chrome:

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

Forneça credenciais Twilio pelo ambiente ou pela configuração. O ambiente mantém
segredos fora de `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Reinicie ou recarregue o Gateway depois de habilitar `voice-call`; mudanças de configuração de plugin
não aparecem em um processo do Gateway já em execução até que ele recarregue.

Então verifique:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Quando a delegação Twilio estiver conectada, `googlemeet setup` inclui verificações bem-sucedidas
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
resolução de espaço ou verificações de pré-verificação da Meet Media API.

O acesso à Google Meet API usa OAuth de usuário: crie um cliente OAuth do Google Cloud,
solicite os escopos necessários, autorize uma conta Google e então armazene o
refresh token resultante na configuração do plugin Google Meet ou forneça as
variáveis de ambiente `OPENCLAW_GOOGLE_MEET_*`.

OAuth não substitui o caminho de entrada pelo Chrome. Os transportes Chrome e Chrome-node
ainda entram por um perfil do Chrome autenticado, BlackHole/SoX e um nó conectado
quando você usa participação pelo navegador. OAuth serve apenas para o caminho oficial da Google
Meet API: criar espaços de reunião, resolver espaços e executar verificações de pré-verificação da Meet Media API.

### Criar credenciais do Google

No Google Cloud Console:

1. Crie ou selecione um projeto Google Cloud.
2. Habilite a **Google Meet REST API** para esse projeto.
3. Configure a tela de consentimento OAuth.
   - **Internal** é mais simples para uma organização Google Workspace.
   - **External** funciona para configurações pessoais/de teste; enquanto o app estiver em Testing,
     adicione cada conta Google que autorizará o app como usuário de teste.
4. Adicione os escopos solicitados pelo OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Crie um ID de cliente OAuth.
   - Tipo de aplicativo: **Web application**.
   - URI de redirecionamento autorizada:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Copie o ID do cliente e o segredo do cliente.

`meetings.space.created` é exigido por `spaces.create` do Google Meet.
`meetings.space.readonly` permite que o OpenClaw resolva URLs/códigos do Meet para espaços.
`meetings.conference.media.readonly` é para pré-verificação da Meet Media API e trabalho de mídia;
o Google pode exigir inscrição no Developer Preview para uso real da Media API.
Se você só precisa de entradas pelo Chrome baseadas em navegador, ignore OAuth completamente.

### Emitir o refresh token

Configure `oauth.clientId` e, opcionalmente, `oauth.clientSecret`, ou passe-os como
variáveis de ambiente, então execute:

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

Use o modo manual quando o navegador não puder alcançar o callback local:

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

Armazene o objeto `oauth` sob a configuração do plugin Google Meet:

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
Se valores de configuração e de ambiente estiverem presentes, o plugin resolve primeiro a configuração
e depois o fallback de ambiente.

O consentimento OAuth inclui criação de espaço do Meet, acesso de leitura a espaço do Meet e acesso
de leitura a mídia de conferência do Meet. Se você autenticou antes de existir suporte
à criação de reuniões, execute novamente `openclaw googlemeet auth login --json` para que o refresh
token tenha o escopo `meetings.space.created`.

### Verificar OAuth com doctor

Execute o doctor de OAuth quando quiser uma verificação de integridade rápida e sem segredos:

```bash
openclaw googlemeet doctor --oauth --json
```

Isso não carrega o runtime do Chrome nem exige um nó Chrome conectado. Ele
verifica que a configuração OAuth existe e que o refresh token consegue emitir um access
token. O relatório JSON inclui apenas campos de status como `ok`, `configured`,
`tokenSource`, `expiresAt` e mensagens de verificação; ele não imprime o access
token, refresh token nem segredo do cliente.

Resultados comuns:

| Verificação          | Significado                                                                            |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` mais `oauth.refreshToken`, ou um access token em cache, está presente. |
| `oauth-token`        | O access token em cache ainda é válido, ou o refresh token emitiu um novo access token. |
| `meet-spaces-get`    | A verificação opcional `--meeting` resolveu um espaço Meet existente.                   |
| `meet-spaces-create` | A verificação opcional `--create-space` criou um novo espaço Meet.                      |

Para comprovar também a habilitação da Google Meet API e o escopo `spaces.create`, execute a
verificação de criação com efeito colateral:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` cria uma URL descartável do Meet. Use isso quando precisar confirmar
que o projeto Google Cloud tem a Meet API habilitada e que a conta autorizada
tem o escopo `meetings.space.created`.

Para comprovar acesso de leitura a um espaço de reunião existente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` e `resolve-space` comprovam acesso de leitura a um espaço
existente que a conta Google autorizada consegue acessar. Um `403` dessas verificações
geralmente significa que a Google Meet REST API está desabilitada, que falta ao refresh token
consentido o escopo necessário ou que a conta Google não consegue acessar esse espaço
Meet. Um erro de refresh token significa executar novamente `openclaw googlemeet auth login
--json` e armazenar o novo bloco `oauth`.

Nenhuma credencial OAuth é necessária para o fallback de navegador. Nesse modo, a autenticação
Google vem do perfil do Chrome autenticado no nó selecionado, não da
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

Execute a pré-verificação antes do trabalho com mídia:

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
por padrão. Passe `--all-conference-records` quando quiser todos os registros mantidos
para essa reunião.

A busca no Calendar pode resolver a URL da reunião pelo Google Calendar antes de ler
artefatos do Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` pesquisa no calendário `primary` de hoje por um evento do Calendar com um
link do Google Meet. Use `--event <query>` para pesquisar texto de evento correspondente, e
`--calendar <id>` para um calendário que não seja o principal. A busca no Calendar exige um novo
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

`artifacts` retorna metadados do registro de conferência mais metadados de recursos de participante, gravação,
transcrição, entrada de transcrição estruturada e notas inteligentes quando
o Google os expõe para a reunião. Use `--no-transcript-entries` para pular
a busca de entradas em reuniões grandes. `attendance` expande participantes em
linhas de sessão de participante com horários da primeira/última visualização, duração total da sessão,
sinalizadores de atraso/saída antecipada e recursos de participante duplicados mesclados por usuário
conectado ou nome de exibição. Passe `--no-merge-duplicates` para manter os recursos brutos de participante
separados, `--late-after-minutes` para ajustar a detecção de atraso e
`--early-before-minutes` para ajustar a detecção de saída antecipada.

`export` grava uma pasta contendo `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` e `manifest.json`.
`manifest.json` registra a entrada escolhida, opções de exportação, registros de conferência,
arquivos de saída, contagens, origem do token, evento do Calendar quando um foi usado e quaisquer
avisos de recuperação parcial. Passe `--zip` para também gravar um arquivo portátil ao lado
da pasta. Passe `--include-doc-bodies` para exportar texto de Google Docs de transcrição vinculada e
notas inteligentes por meio de `files.export` do Google Drive; isso exige um
novo login OAuth que inclua o escopo somente leitura do Drive Meet. Sem
`--include-doc-bodies`, as exportações incluem apenas metadados do Meet e entradas de transcrição
estruturadas. Se o Google retornar uma falha parcial de artefato, como um erro de listagem de notas inteligentes,
entrada de transcrição ou corpo de documento do Drive, o resumo e
o manifesto mantêm o aviso em vez de falhar a exportação inteira.
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

Execute o smoke ao vivo protegido contra uma reunião real mantida:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Ambiente do smoke ao vivo:

- `OPENCLAW_LIVE_TEST=1` habilita testes ao vivo protegidos.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` aponta para uma URL, um código ou
  `spaces/{id}` do Meet mantido.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID` fornece o ID do cliente OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN` fornece
  o token de atualização.
- Opcional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` e
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` usam os mesmos nomes de fallback
  sem o prefixo `OPENCLAW_`.

O smoke ao vivo básico de artefatos/presença precisa de
`https://www.googleapis.com/auth/meetings.space.readonly` e
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. A busca no Calendar
precisa de `https://www.googleapis.com/auth/calendar.events.readonly`. A exportação de
corpo de documento do Drive precisa de
`https://www.googleapis.com/auth/drive.meet.readonly`.

Crie um novo espaço do Meet:

```bash
openclaw googlemeet create
```

O comando imprime o novo `meeting uri`, a origem e a sessão de entrada. Com credenciais OAuth,
ele usa a API oficial do Google Meet. Sem credenciais OAuth, ele
usa o perfil de navegador conectado do nó Chrome fixado como fallback. Agentes podem
usar a ferramenta `google_meet` com `action: "create"` para criar e entrar em uma
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

Se o fallback do navegador encontrar login do Google ou um bloqueio de permissão do Meet antes que
possa criar a URL, o método do Gateway retornará uma resposta com falha e a
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
`manualActionMessage` mais o contexto de nó/aba do navegador e parar de abrir novas
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
precisa de um perfil do Google Chrome conectado para entrar pelo navegador. Se o
perfil estiver desconectado, o OpenClaw informa `manualActionRequired: true` ou um
erro de fallback do navegador e pede que o operador conclua o login do Google antes de
tentar novamente.

Defina `preview.enrollmentAcknowledged: true` somente depois de confirmar que seu projeto Cloud,
principal OAuth e participantes da reunião estão inscritos no Google Workspace Developer Preview Program para APIs de mídia do Meet.

## Configuração

O caminho comum em tempo real do Chrome só precisa que o Plugin esteja habilitado, BlackHole, SoX
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
- `chromeNode.node`: ID/nome/IP opcional do nó para `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nome usado na tela de convidado desconectado do Meet
- `chrome.autoJoin: true`: preenchimento de nome de convidado e clique em Entrar agora por melhor esforço
  por meio da automação de navegador do OpenClaw em `chrome-node`
- `chrome.reuseExistingTab: true`: ativa uma aba existente do Meet em vez de
  abrir duplicatas
- `chrome.waitForInCallMs: 20000`: aguarda a aba do Meet informar que está em chamada
  antes que a introdução em tempo real seja acionada
- `chrome.audioFormat: "pcm16-24khz"`: formato de áudio de par de comandos. Use
  `"g711-ulaw-8khz"` somente para pares de comandos legados/personalizados que ainda emitem
  áudio de telefonia.
- `chrome.audioInputCommand`: comando SoX que lê de CoreAudio `BlackHole 2ch`
  e grava áudio em `chrome.audioFormat`
- `chrome.audioOutputCommand`: comando SoX que lê áudio em `chrome.audioFormat`
  e grava em CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: comando opcional de microfone local que grava
  PCM mono little-endian assinado de 16 bits para detecção de interrupção humana enquanto
  a reprodução do assistente está ativa. Isso atualmente se aplica à ponte de par de comandos
  `chrome` hospedada pelo Gateway.
- `chrome.bargeInRmsThreshold: 650`: nível RMS que conta como uma interrupção humana
  em `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: nível de pico que conta como uma interrupção humana
  em `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: atraso mínimo entre limpezas repetidas de interrupção humana
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: respostas faladas breves, com
  `openclaw_agent_consult` para respostas mais aprofundadas
- `realtime.introMessage`: breve verificação falada de prontidão quando a ponte em tempo real
  se conecta; defina como `""` para entrar silenciosamente
- `realtime.agentId`: ID opcional de agente OpenClaw para
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

`voiceCall.enabled` usa `true` por padrão; com o transporte Twilio, ele delega a chamada PSTN real, DTMF e a saudação de introdução para o Plugin Voice Call. Voice Call reproduz a sequência DTMF antes de abrir o stream de mídia em tempo real e, em seguida, usa o texto de introdução salvo como a saudação inicial em tempo real. Se `voice-call` não estiver habilitado, o Google Meet ainda poderá validar e registrar o plano de discagem, mas não poderá fazer a chamada Twilio.

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

Use `transport: "chrome"` quando o Chrome for executado no host do Gateway. Use `transport: "chrome-node"` quando o Chrome for executado em um Node pareado, como uma VM do Parallels. Em ambos os casos, o modelo em tempo real e `openclaw_agent_consult` são executados no host do Gateway, portanto as credenciais do modelo permanecem lá.

Use `action: "status"` para listar sessões ativas ou inspecionar um ID de sessão. Use `action: "speak"` com `sessionId` e `message` para fazer o agente em tempo real falar imediatamente. Use `action: "test_speech"` para criar ou reutilizar a sessão, acionar uma frase conhecida e retornar a integridade `inCall` quando o host do Chrome puder relatá-la. `test_speech` sempre força `mode: "realtime"` e falha se for solicitado a executar em `mode: "transcribe"`, porque sessões somente de observação intencionalmente não podem emitir fala. Seu resultado `speechOutputVerified` se baseia no aumento de bytes de saída de áudio em tempo real durante esta chamada de teste, portanto uma sessão reutilizada com áudio antigo não conta como uma nova verificação de fala bem-sucedida. Use `action: "leave"` para marcar uma sessão como encerrada.

`status` inclui a integridade do Chrome quando disponível:

- `inCall`: o Chrome parece estar dentro da chamada do Meet
- `micMuted`: estado do microfone do Meet em melhor esforço
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: o perfil do navegador precisa de login manual, admissão pelo host do Meet, permissões ou reparo do controle do navegador antes que a fala possa funcionar
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: se a fala gerenciada do Chrome está permitida agora. `speechReady: false` significa que o OpenClaw não enviou a frase de introdução/teste para a ponte de áudio.
- `providerConnected` / `realtimeReady`: estado da ponte de voz em tempo real
- `lastInputAt` / `lastOutputAt`: último áudio visto vindo da ponte ou enviado para ela
- `lastSuppressedInputAt` / `suppressedInputBytes`: entrada de loopback ignorada enquanto a reprodução do assistente está ativa

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Consulta do agente em tempo real

O modo em tempo real do Chrome é otimizado para um loop de voz ao vivo. O provedor de voz em tempo real ouve o áudio da reunião e fala por meio da ponte de áudio configurada. Quando o modelo em tempo real precisa de raciocínio mais profundo, informações atuais ou ferramentas normais do OpenClaw, ele pode chamar `openclaw_agent_consult`.

A ferramenta de consulta executa o agente OpenClaw normal em segundo plano com o contexto recente da transcrição da reunião e retorna uma resposta falada concisa para a sessão de voz em tempo real. O modelo de voz então pode falar essa resposta de volta na reunião. Ela usa a mesma ferramenta compartilhada de consulta em tempo real que o Voice Call.

Por padrão, as consultas são executadas no agente `main`. Defina `realtime.agentId` quando uma trilha do Meet deve consultar um workspace dedicado de agente OpenClaw, padrões de modelo, política de ferramentas, memória e histórico de sessão.

`realtime.toolPolicy` controla a execução da consulta:

- `safe-read-only`: expõe a ferramenta de consulta e limita o agente normal a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e `memory_get`.
- `owner`: expõe a ferramenta de consulta e permite que o agente normal use a política normal de ferramentas do agente.
- `none`: não expõe a ferramenta de consulta ao modelo de voz em tempo real.

A chave de sessão da consulta tem escopo por sessão do Meet, portanto chamadas de consulta de acompanhamento podem reutilizar o contexto anterior da consulta durante a mesma reunião.

Para forçar uma verificação de prontidão falada depois que o Chrome entrou totalmente na chamada:

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
- `googlemeet setup` inclui `chrome-node-connected` quando Chrome-node é o transporte padrão ou um Node está fixado.
- `nodes status` mostra o Node selecionado conectado.
- O Node selecionado anuncia tanto `googlemeet.chrome` quanto `browser.proxy`.
- A aba do Meet entra na chamada e `test-speech` retorna a integridade do Chrome com `inCall: true`.

Para um host remoto do Chrome, como uma VM macOS do Parallels, esta é a verificação segura mais curta depois de atualizar o Gateway ou a VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Isso comprova que o Plugin do Gateway está carregado, que o Node da VM está conectado com o token atual e que a ponte de áudio do Meet está disponível antes que um agente abra uma aba de reunião real.

Para um smoke do Twilio, use uma reunião que exponha detalhes de discagem por telefone:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Estado esperado do Twilio:

- `googlemeet setup` inclui verificações verdes de `twilio-voice-call-plugin`, `twilio-voice-call-credentials` e `twilio-voice-call-webhook`.
- `voicecall` está disponível na CLI após o recarregamento do Gateway.
- A sessão retornada tem `transport: "twilio"` e um `twilio.voiceCallId`.
- `openclaw logs --follow` mostra DTMF TwiML servido antes do TwiML em tempo real e, em seguida, uma ponte em tempo real com a saudação inicial enfileirada.
- `googlemeet leave <sessionId>` encerra a chamada de voz delegada.

## Solução de problemas

### O agente não consegue ver a ferramenta Google Meet

Confirme que o Plugin está habilitado na configuração do Gateway e recarregue o Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Se você acabou de editar `plugins.entries.google-meet`, reinicie ou recarregue o Gateway. O agente em execução só vê ferramentas de Plugin registradas pelo processo atual do Gateway.

### Nenhum Node compatível com Google Meet conectado

No host do Node, execute:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

No host do Gateway, aprove o Node e verifique os comandos:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

O Node deve estar conectado e listar `googlemeet.chrome` mais `browser.proxy`. A configuração do Gateway deve permitir esses comandos do Node:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Se `googlemeet setup` falhar em `chrome-node-connected` ou o log do Gateway relatar `gateway token mismatch`, reinstale ou reinicie o Node com o token atual do Gateway. Para um Gateway em LAN, isso geralmente significa:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Depois recarregue o serviço do Node e execute novamente:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### O navegador abre, mas o agente não consegue entrar

Execute `googlemeet test-speech` e inspecione a integridade do Chrome retornada. Se ela relatar `manualActionRequired: true`, mostre `manualActionMessage` ao operador e pare de tentar novamente até que a ação no navegador esteja concluída.

Ações manuais comuns:

- Entrar no perfil do Chrome.
- Admitir o convidado pela conta do host do Meet.
- Conceder permissões de microfone/câmera ao Chrome quando o prompt de permissão nativo do Chrome aparecer.
- Fechar ou reparar uma caixa de diálogo de permissão do Meet travada.

Não relate "not signed in" só porque o Meet mostra "Do you want people to hear you in the meeting?" Esse é o intersticial de escolha de áudio do Meet; o OpenClaw clica em **Use microphone** por automação do navegador quando disponível e continua aguardando o estado real da reunião. Para fallback de navegador somente para criação, o OpenClaw pode clicar em **Continue without microphone** porque criar a URL não precisa do caminho de áudio em tempo real.

### Falha na criação da reunião

`googlemeet create` primeiro usa o endpoint `spaces.create` da API do Google Meet quando credenciais OAuth estão configuradas. Sem credenciais OAuth, ele faz fallback para o navegador do Node Chrome fixado. Confirme:

- Para criação por API: `oauth.clientId` e `oauth.refreshToken` estão configurados, ou variáveis de ambiente `OPENCLAW_GOOGLE_MEET_*` correspondentes estão presentes.
- Para criação por API: o token de atualização foi emitido depois que o suporte de criação foi adicionado. Tokens mais antigos podem não ter o escopo `meetings.space.created`; execute novamente `openclaw googlemeet auth login --json` e atualize a configuração do Plugin.
- Para fallback de navegador: `defaultTransport: "chrome-node"` e `chromeNode.node` apontam para um Node conectado com `browser.proxy` e `googlemeet.chrome`.
- Para fallback de navegador: o perfil Chrome do OpenClaw nesse Node está conectado ao Google e pode abrir `https://meet.google.com/new`.
- Para fallback de navegador: novas tentativas reutilizam uma aba existente de `https://meet.google.com/new` ou de prompt de conta Google antes de abrir uma nova aba. Se um agente atingir o tempo limite, repita a chamada da ferramenta em vez de abrir manualmente outra aba do Meet.
- Para fallback de navegador: se a ferramenta retornar `manualActionRequired: true`, use `browser.nodeId`, `browser.targetId`, `browserUrl` e `manualActionMessage` retornados para orientar o operador. Não tente novamente em loop até que essa ação esteja concluída.
- Para fallback de navegador: se o Meet mostrar "Do you want people to hear you in the meeting?", deixe a aba aberta. O OpenClaw deve clicar em **Use microphone** ou, para fallback somente de criação, em **Continue without microphone** por automação do navegador e continuar aguardando a URL do Meet gerada. Se não conseguir, o erro deve mencionar `meet-audio-choice-required`, não `google-login-required`.

### O agente entra, mas não fala

Verifique o caminho em tempo real:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Use `mode: "realtime"` para escutar/responder. `mode: "transcribe"` intencionalmente
não inicia a ponte de voz duplex em tempo real. Para depuração somente de observação,
execute `openclaw googlemeet status --json <session-id>` depois que os participantes falarem
e verifique `captioning`, `transcriptLines` e `lastCaptionText`. Se `inCall` for
true, mas `transcriptLines` permanecer em `0`, as legendas do Meet podem estar desativadas, ninguém
falou desde que o observador foi instalado, a UI do Meet mudou ou as legendas ao vivo
não estão disponíveis para o idioma/conta da reunião.

`googlemeet test-speech` sempre verifica o caminho em tempo real e informa se
bytes de saída da ponte foram observados para essa invocação. Se `speechOutputVerified` for false e
`speechOutputTimedOut` for true, o provedor em tempo real pode ter aceitado a
fala, mas o OpenClaw não viu novos bytes de saída chegarem à ponte de áudio do
Chrome.

Verifique também:

- Uma chave de provedor em tempo real está disponível no host do Gateway, como
  `OPENAI_API_KEY` ou `GEMINI_API_KEY`.
- `BlackHole 2ch` está visível no host do Chrome.
- `sox` existe no host do Chrome.
- O microfone e o alto-falante do Meet estão roteados pelo caminho de áudio virtual usado pelo
  OpenClaw.

`googlemeet doctor [session-id]` imprime a sessão, o Node, o estado na chamada,
o motivo da ação manual, a conexão do provedor em tempo real, `realtimeReady`, a atividade de
entrada/saída de áudio, os últimos carimbos de data/hora de áudio, os contadores de bytes e a URL do navegador.
Use `googlemeet status [session-id] --json` quando precisar do JSON bruto. Use
`googlemeet doctor --oauth` quando precisar verificar a atualização do OAuth do Google Meet
sem expor tokens; adicione `--meeting` ou `--create-space` quando também precisar de uma
prova da API do Google Meet.

Se um agente expirou e você consegue ver uma aba do Meet já aberta, inspecione essa aba
sem abrir outra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

A ação de ferramenta equivalente é `recover_current_tab`. Ela focaliza e inspeciona uma
aba existente do Meet para o transporte selecionado. Com `chrome`, ela usa controle local
do navegador por meio do Gateway; com `chrome-node`, ela usa o Node do Chrome configurado.
Ela não abre uma nova aba nem cria uma nova sessão; ela informa o
bloqueador atual, como login, admissão, permissões ou estado de escolha de áudio.
O comando da CLI se comunica com o Gateway configurado, portanto o Gateway deve estar em execução;
`chrome-node` também exige que o Node do Chrome esteja conectado.

### As verificações de configuração do Twilio falham

`twilio-voice-call-plugin` falha quando `voice-call` não é permitido ou não está habilitado.
Adicione-o a `plugins.allow`, habilite `plugins.entries.voice-call` e recarregue o
Gateway.

`twilio-voice-call-credentials` falha quando o backend do Twilio está sem o SID da conta,
o token de autenticação ou o número chamador. Defina-os no host do Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` falha quando `voice-call` não tem exposição pública de Webhook
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
host privado:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // ou
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

`voicecall smoke` é apenas de prontidão por padrão. Para simular um número específico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Adicione `--yes` somente quando você intencionalmente quiser fazer uma chamada de notificação
ativa de saída:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### A chamada do Twilio inicia, mas nunca entra na reunião

Confirme que o evento do Meet expõe os detalhes de discagem por telefone. Passe o número de
discagem exato e o PIN ou uma sequência DTMF personalizada:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Use `w` inicial ou vírgulas em `--dtmf-sequence` se o provedor precisar de uma pausa
antes de inserir o PIN.

Se a chamada telefônica for criada, mas a lista do Meet nunca mostrar o participante
por discagem:

- Execute `openclaw googlemeet doctor <session-id>` para confirmar o ID da chamada Twilio
  delegada, se o DTMF foi enfileirado e se a saudação inicial foi solicitada.
- Execute `openclaw voicecall status --call-id <id>` e confirme que a chamada ainda está
  ativa.
- Execute `openclaw voicecall tail` e verifique se os Webhooks do Twilio estão chegando ao
  Gateway.
- Execute `openclaw logs --follow` e procure a sequência do Twilio Meet: o Google
  Meet delega a entrada, o Voice Call armazena o TwiML DTMF de pré-conexão, serve
  esse TwiML inicial, depois serve TwiML em tempo real e inicia a ponte em tempo real
  com `initialGreeting=queued`.
- Execute novamente `openclaw googlemeet setup --transport twilio`; uma verificação de configuração verde é
  obrigatória, mas não prova que a sequência do PIN da reunião está correta.
- Confirme que o número de discagem pertence ao mesmo convite e à mesma região do Meet que
  o PIN.
- Aumente as pausas iniciais em `--dtmf-sequence` se o Meet atender lentamente, por
  exemplo `wwww123456#`.
- Se o participante entrar, mas você não ouvir a saudação, verifique
  `openclaw logs --follow` para TwiML em tempo real, inicialização da ponte em tempo real e
  `initialGreeting=queued`. A saudação é gerada a partir da mensagem inicial
  `voicecall.start` depois que a ponte em tempo real se conecta.

Se os Webhooks não chegarem, depure primeiro o Plugin Voice Call: o provedor deve
alcançar `plugins.entries.voice-call.config.publicUrl` ou o túnel configurado.
Consulte [Solução de problemas de chamada de voz](/pt-BR/plugins/voice-call#troubleshooting).

## Observações

A API de mídia oficial do Google Meet é orientada a recebimento, portanto falar em uma chamada do Meet
ainda precisa de um caminho de participante. Este Plugin mantém esse limite visível:
o Chrome cuida da participação pelo navegador e do roteamento de áudio local; o Twilio cuida da
participação por discagem telefônica.

O modo em tempo real do Chrome precisa de `BlackHole 2ch` mais uma destas opções:

- `chrome.audioInputCommand` mais `chrome.audioOutputCommand`: o OpenClaw controla a
  ponte do modelo em tempo real e canaliza áudio em `chrome.audioFormat` entre esses
  comandos e o provedor de voz em tempo real selecionado. O caminho padrão do Chrome é
  PCM16 de 24 kHz; G.711 mu-law de 8 kHz permanece disponível para pares de comandos legados.
- `chrome.audioBridgeCommand`: um comando de ponte externo controla todo o caminho de
  áudio local e deve sair depois de iniciar ou validar seu daemon.

Para áudio duplex limpo, roteie a saída do Meet e o microfone do Meet por dispositivos
virtuais separados ou por um grafo de dispositivo virtual no estilo Loopback. Um único dispositivo
BlackHole compartilhado pode ecoar outros participantes de volta para a chamada.

Com a ponte do Chrome por par de comandos, `chrome.bargeInInputCommand` pode escutar um
microfone local separado e limpar a reprodução do assistente quando a pessoa começa a
falar. Isso mantém a fala humana à frente da saída do assistente mesmo quando a entrada de
loopback BlackHole compartilhada é temporariamente suprimida durante a reprodução do assistente.
Assim como `chrome.audioInputCommand` e `chrome.audioOutputCommand`, ele é um
comando local configurado pelo operador. Use um caminho de comando confiável explícito ou
lista de argumentos, e não aponte para scripts de locais não confiáveis.

`googlemeet speak` aciona a ponte de áudio em tempo real ativa para uma sessão do Chrome.
`googlemeet leave` interrompe essa ponte. Para sessões do Twilio delegadas
por meio do Plugin Voice Call, `leave` também encerra a chamada de voz subjacente.

## Relacionado

- [Plugin de chamada de voz](/pt-BR/plugins/voice-call)
- [Modo de conversa](/pt-BR/nodes/talk)
- [Criação de plugins](/pt-BR/plugins/building-plugins)
