---
read_when:
    - Você quer que um agente do OpenClaw entre em uma chamada do Google Meet
    - Você quer que um agente do OpenClaw crie uma nova chamada no Google Meet
    - Você está configurando o Chrome, o Node do Chrome ou a Twilio como um transporte do Google Meet
summary: 'Plugin do Google Meet: entre em URLs explícitas do Meet pelo Chrome ou Twilio com padrões de resposta por voz do agente'
title: Plugin do Google Meet
x-i18n:
    generated_at: "2026-07-12T15:24:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5a3a0d2675bdfaeaa869652593fd1931c3afdefe0ed95f13935dade976ff038c
    source_path: plugins/google-meet.md
    workflow: 16
---

O plugin `google-meet` entra em URLs explícitas do Meet em nome de um agente do OpenClaw. Ele é deliberadamente restrito:

- Ele entra apenas em URLs `https://meet.google.com/...`; nunca disca para uma reunião usando um número de telefone que ele próprio descobriu.
- `googlemeet create` pode gerar uma nova URL do Meet por meio da API Google Meet (ou de um fallback do navegador) e entrar nela por padrão.
- A participação pelo Chrome usa um perfil do Chrome com login ativo, opcionalmente em um Node pareado. A participação pelo Twilio disca um número de telefone com PIN/DTMF por meio do [Plugin de chamada de voz](/pt-BR/plugins/voice-call); ela não pode discar diretamente para uma URL do Meet.
- `mode: "agent"` (padrão) transcreve a fala dos participantes com um provedor em tempo real, encaminha-a ao agente configurado do OpenClaw e reproduz a resposta usando o TTS normal do OpenClaw. `mode: "bidi"` permite que um modelo de voz em tempo real responda diretamente. `mode: "transcribe"` entra apenas para observar, sem resposta por voz.
- Não há anúncio automático de consentimento quando o plugin entra em uma chamada.
- O comando da CLI é `googlemeet`; `meet` é reservado para fluxos de trabalho mais amplos de teleconferência de agentes.

## Início rápido

Instale as dependências de áudio locais e defina uma chave de provedor em tempo real. OpenAI é o provedor de transcrição padrão para o modo `agent`; Google Gemini Live está disponível como provedor de voz do modo `bidi`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# necessário apenas quando realtime.voiceProvider é "google" no modo bidi
export GEMINI_API_KEY=...
```

`blackhole-2ch` instala o dispositivo de áudio virtual `BlackHole 2ch` pelo qual o Chrome encaminha o áudio. O instalador do Homebrew exige uma reinicialização antes que o macOS disponibilize o dispositivo:

```bash
sudo reboot
```

Após a reinicialização, verifique ambos os componentes:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Ative o plugin:

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

Verifique a configuração e, em seguida, entre:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

A saída de `setup` pode ser lida pelo agente e considera o modo e o transporte: ela informa o perfil do Chrome, a fixação do Node e, para entradas em tempo real pelo Chrome, a ponte de áudio BlackHole/SoX e a verificação da introdução atrasada. Entradas apenas para observação ignoram os pré-requisitos de tempo real:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Quando a delegação ao Twilio está configurada, `setup` também informa se `voice-call`, as credenciais do Twilio e a exposição pública do Webhook estão prontos. Trate qualquer verificação com `ok: false` como um bloqueio para esse transporte/modo antes que um agente entre. Use `--json` para obter uma saída legível por máquina e `--transport chrome|chrome-node|twilio` para verificar previamente um transporte específico:

```bash
openclaw googlemeet setup --transport twilio
```

Ou permita que um agente entre por meio da ferramenta `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Em hosts do Gateway que não usam macOS, `google_meet` permanece visível para ações de artefato, calendário, configuração, transcrição, Twilio e `chrome-node`, mas a resposta por voz do Chrome local (`transport: "chrome"` com `mode: "agent"` ou `"bidi"`) é bloqueada antes de chegar à ponte de áudio, pois esse caminho depende atualmente do `BlackHole 2ch` no macOS. Em vez disso, use `mode: "transcribe"`, discagem pelo Twilio ou um host macOS `chrome-node`.

### Criar uma reunião

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

`create` tem dois caminhos, informados no campo `source` do resultado:

- **`api`**: usado quando as credenciais OAuth do Google Meet estão configuradas. Determinístico; não depende do estado da interface do navegador.
- **`browser`**: usado sem credenciais OAuth. O OpenClaw abre `https://meet.google.com/new` no Node do Chrome fixado e aguarda o Google redirecionar para uma URL real com código de reunião; o perfil do OpenClaw no Chrome desse Node já deve estar conectado ao Google. Tanto a entrada quanto a criação reutilizam uma guia existente do Meet (ou uma guia em andamento de `.../new` / solicitação de conta do Google) antes de abrir uma nova; a correspondência de guias ignora strings de consulta inofensivas, como `authuser`.

`create` entra por padrão e retorna `joined: true` junto com a sessão de entrada. Passe `--no-join` (CLI) ou `"join": false` (ferramenta) para gerar somente a URL.

Para salas criadas pela API, defina uma política de acesso explícita em vez de herdar o padrão da conta do Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | Quem pode entrar sem pedir autorização                                            |
| --------------- | --------------------------------------------------------------------------------- |
| `OPEN`          | Qualquer pessoa com a URL do Meet                                                 |
| `TRUSTED`       | Usuários confiáveis da organização do anfitrião, usuários externos convidados e usuários que entram por discagem |
| `RESTRICTED`    | Somente convidados                                                                |

Isso se aplica apenas a salas criadas pela API, portanto o OAuth deve estar configurado. Se você se autenticou antes de essa opção existir, execute novamente `openclaw googlemeet auth login --json` após adicionar o escopo `meetings.space.settings` à sua tela de consentimento OAuth.

Se o fallback do navegador encontrar um bloqueio de login do Google ou de permissão do Meet, a ferramenta retornará `manualActionRequired: true` com `manualActionReason`, `manualActionMessage` e `browser.nodeId`/`browser.targetId`/`browserUrl`. Informe essa mensagem e pare de abrir novas guias do Meet até que o operador conclua a etapa no navegador.

### Entrada apenas para observação

Defina `"mode": "transcribe"` para ignorar a ponte duplex em tempo real (sem requisito de BlackHole/SoX e sem resposta por voz). As entradas pelo Chrome no modo de transcrição também ignoram a concessão de permissão de microfone/câmera do OpenClaw e a opção **Use microphone** do Meet; se o Meet exibir a tela intermediária de escolha de áudio, a automação tentará primeiro **Continue without microphone**. Os transportes gerenciados do Chrome nesse modo instalam um observador de legendas do Meet em caráter de melhor esforço. `googlemeet status --json` e `googlemeet doctor` informam `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` e um trecho final de `recentTranscript`.

Para ler a transcrição limitada da sessão, consulte a guia exata do Meet que está sendo monitorada:

```bash
openclaw googlemeet transcript <session-id>
openclaw googlemeet transcript <session-id> --since <next-index> --json
```

O observador mantém no máximo 2.000 linhas de legenda concluídas na página do Meet. O texto progressivo visível permanece no trecho de integridade do status até que a linha da legenda seja concluída; portanto, salvar `nextIndex` não pode ignorar uma expansão posterior do texto. Ao sair, as linhas visíveis são finalizadas antes do snapshot. `droppedLines` informa as linhas perdidas no início quando o limite é excedido. As transcrições das quatro sessões encerradas mais recentemente permanecem legíveis até que o Gateway seja reiniciado. Transcrições encerradas mais antigas retornam `evicted: true`. Isso é intencionalmente memória de runtime, e não armazenamento durável do histórico de reuniões: reiniciar o Gateway, fechar a guia antes de um snapshot ou exceder os limites documentados pode causar a perda de legendas.

Para uma sondagem de escuta com resposta sim/não:

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

O comando entra no modo de transcrição, aguarda uma nova movimentação de legenda/transcrição e retorna `listenVerified`, `listenTimedOut`, os campos de ação manual e a integridade atual das legendas.

### Integridade da sessão em tempo real

Durante sessões com resposta por voz, o status de `google_meet` informa a integridade do Chrome e da ponte de áudio: `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, os últimos timestamps de entrada/saída, os contadores de bytes e o estado de fechamento da ponte. As sessões gerenciadas do Chrome só reproduzem a introdução/frase de teste depois que a integridade informa `inCall: true`; caso contrário, `speechReady: false`, e a tentativa de fala é bloqueada em vez de silenciosamente não fazer nada.

As entradas pelo Chrome local usam o perfil conectado do navegador do OpenClaw e precisam do `BlackHole 2ch` para o caminho de microfone/alto-falante. Um único dispositivo BlackHole é suficiente para um primeiro teste de fumaça, mas pode causar eco; use dispositivos virtuais separados ou um grafo no estilo Loopback para obter áudio duplex limpo.

## Gateway local + Chrome no Parallels

Não é necessário ter um Gateway completo nem uma chave de API de modelo dentro de uma VM do macOS apenas para disponibilizar o Chrome. Execute o Gateway e o agente localmente; execute um host de Node na VM.

| Executado em          | O quê                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| Host do Gateway       | Gateway do OpenClaw, espaço de trabalho do agente, chaves de modelo/API, provedor em tempo real, configuração do plugin Google Meet |
| VM macOS do Parallels | CLI/host de Node do OpenClaw, Chrome, SoX, BlackHole 2ch, um perfil do Chrome conectado ao Google |
| Desnecessário na VM   | Serviço do Gateway, configuração do agente, configuração do provedor de modelo                  |

Instale as dependências da VM, reinicie e verifique:

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Ative o plugin na VM e inicie o host de Node:

```bash
openclaw plugins enable google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Se `<gateway-host>` for um IP da LAN sem TLS, habilite explicitamente essa rede privada confiável:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Use a mesma flag ao instalar como um LaunchAgent (ela é uma variável de ambiente do processo, armazenada no ambiente do LaunchAgent quando está presente no comando de instalação, e não uma configuração de `openclaw.json`):

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

Aprove o Node no host do Gateway e confirme que ele anuncia tanto `googlemeet.chrome` quanto o recurso de navegador/`browser.proxy`:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Encaminhe o Meet por esse Node:

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

Agora entre normalmente pelo host do Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Para um teste de fumaça com um único comando que cria ou reutiliza uma sessão, reproduz uma frase conhecida e imprime a integridade da sessão:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante a entrada em tempo real, a automação do navegador preenche o nome do convidado, clica em Join/Ask to join e aceita a solicitação inicial "Use microphone" do Meet quando ela aparece (ou "Continue without microphone" durante uma entrada apenas para observação e a criação de reunião somente pelo navegador). Se o perfil estiver desconectado, o Meet estiver aguardando a admissão pelo anfitrião, o Chrome precisar de permissão para microfone/câmera ou o Meet estiver preso em uma solicitação não resolvida, o resultado informará `manualActionRequired: true` com `manualActionReason` e `manualActionMessage`. Pare de tentar novamente, informe essa mensagem junto com `browserUrl`/`browserTitle` e tente novamente somente após a conclusão da ação manual.

Se `chromeNode.node` for omitido, o OpenClaw fará a seleção automática somente quando exatamente um Node conectado anunciar tanto `googlemeet.chrome` quanto o controle do navegador; fixe `chromeNode.node` (ID do Node, nome de exibição ou IP remoto) quando vários Nodes compatíveis estiverem conectados.

### Verificações de falhas comuns

| Sintoma                                                  | Correção                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Configured Google Meet node ... is not usable: offline` | O Node fixado é conhecido, mas está indisponível. Informe o bloqueio de configuração; não use silenciosamente outro transporte como alternativa, a menos que isso seja solicitado.                                                                                      |
| `No connected Google Meet-capable node`                  | Execute `openclaw node run` na VM, aprove o pareamento e execute `openclaw plugins enable google-meet` e `openclaw plugins enable browser` nela. Confirme que `gateway.nodes.allowCommands` inclui `googlemeet.chrome` e `browser.proxy`.                                |
| `BlackHole 2ch audio device not found`                   | Instale `blackhole-2ch` no host que está sendo verificado e reinicie-o.                                                                                                                                                                                                |
| `BlackHole 2ch audio device not found on the node`       | Instale `blackhole-2ch` na VM e reinicie a VM.                                                                                                                                                                                                                         |
| O Chrome abre, mas não consegue entrar                   | Entre no perfil do navegador na VM ou mantenha `chrome.guestName` definido. A entrada automática como convidado usa a automação de navegador do OpenClaw por meio do proxy de navegador do Node; aponte `browser.defaultProfile` do Node (ou um perfil nomeado de sessão existente) para o perfil desejado. |
| Abas duplicadas do Meet                                  | Mantenha `chrome.reuseExistingTab: true`. O OpenClaw ativa uma aba existente para a mesma URL, e a criação reutiliza uma aba `.../new` em andamento ou uma aba de solicitação de conta do Google antes de abrir outra.                                                  |
| Sem áudio                                                | Encaminhe o microfone/alto-falante do Meet pelo caminho de áudio virtual usado pelo OpenClaw; use dispositivos virtuais separados ou roteamento semelhante ao Loopback para obter áudio duplex limpo.                                                                   |

## Notas de instalação

A configuração padrão de retorno de áudio do Chrome usa duas ferramentas externas que o OpenClaw não inclui nem redistribui; instale-as como dependências do host por meio do Homebrew:

- `sox`: utilitário de áudio de linha de comando. O Plugin emite comandos explícitos de dispositivo CoreAudio para a ponte de áudio PCM16 padrão de 24 kHz.
- `blackhole-2ch`: driver de áudio virtual do macOS que fornece o dispositivo `BlackHole 2ch` pelo qual o Chrome/Meet faz o roteamento.

O SoX é licenciado sob `LGPL-2.0-only AND GPL-2.0-only`; o BlackHole é GPL-3.0. Se você criar um instalador ou appliance que inclua o BlackHole com o OpenClaw, analise o licenciamento upstream do BlackHole ou obtenha uma licença separada da Existential Audio.

## Transportes

| Transporte    | Use quando                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------- |
| `chrome`      | O Chrome/áudio estiver no host do Gateway                                                    |
| `chrome-node` | O Chrome/áudio estiver em um Node pareado (por exemplo, uma VM macOS do Parallels)            |
| `twilio`      | For necessário usar a discagem telefônica como alternativa por meio do Plugin Voice Call, quando a participação pelo Chrome não estiver disponível |

### Chrome

Abre a URL do Meet por meio do controle de navegador do OpenClaw e entra usando o perfil de navegador do OpenClaw com sessão iniciada. No macOS, o Plugin verifica a presença de `BlackHole 2ch` antes da inicialização e, se configurado, executa um comando de integridade/inicialização da ponte de áudio antes de abrir o Chrome. Para o Chrome local, selecione o perfil com `browser.defaultProfile`; `chrome.browserProfile` é repassado aos hosts `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

O áudio do microfone/alto-falante do Chrome é encaminhado pela ponte de áudio local do OpenClaw. Se `BlackHole 2ch` não estiver instalado, a entrada falhará com um erro de configuração, em vez de ocorrer sem um caminho de áudio.

### Twilio

Um plano de discagem estrito delegado ao [Plugin Voice Call](/pt-BR/plugins/voice-call). Ele não analisa páginas do Meet em busca de números de telefone; o Google Meet deve disponibilizar um número de discagem telefônica e um PIN para a reunião.

Ative o Voice Call no host do Gateway, não no Node do Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
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
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Entre neste Google Meet como um agente do OpenClaw. Seja breve.",
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

Forneça as credenciais do Twilio por meio do ambiente para manter os segredos fora de `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Como alternativa, use `realtime.provider: "openai"` com `OPENAI_API_KEY` se a OpenAI for a provedora de voz em tempo real.

Reinicie ou recarregue o Gateway depois de ativar `voice-call`; as alterações de configuração do Plugin não entram em vigor até o recarregamento. Verifique:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Quando a delegação ao Twilio estiver configurada, `googlemeet setup` incluirá as verificações `twilio-voice-call-plugin`, `twilio-voice-call-credentials` e `twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Use `--dtmf-sequence` para uma sequência personalizada, com `w` no início ou vírgulas para inserir uma pausa antes do PIN:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth e pré-verificação

O OAuth é opcional para criar um link do Meet, pois `googlemeet create` pode usar a automação de navegador como alternativa. Configure o OAuth para criação pela API oficial, resolução de espaços ou pré-verificação da Meet Media API. As entradas pelo Chrome/Chrome-node nunca dependem do OAuth; elas usam um perfil do Chrome com sessão iniciada, BlackHole/SoX e, para `chrome-node`, um Node conectado em qualquer caso.

### Criar credenciais do Google

No Google Cloud Console:

<Steps>
<Step title="Criar ou selecionar um projeto">
</Step>
<Step title="Ativar a Google Meet REST API">
</Step>
<Step title="Configurar a tela de consentimento OAuth">
Internal é a opção mais simples para uma organização do Google Workspace. External funciona para configurações pessoais/de teste; enquanto o aplicativo estiver em Testing, adicione como usuário de teste cada conta do Google que o autorizará.
</Step>
<Step title="Adicionar os escopos solicitados">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly` (consulta ao Calendar)
- `https://www.googleapis.com/auth/drive.meet.readonly` (exportação do corpo de documentos de transcrição/notas inteligentes)

</Step>
<Step title="Criar um ID de cliente OAuth">
Tipo de aplicativo **Web application**. URI de redirecionamento autorizado:

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="Copiar o ID e o segredo do cliente">
</Step>
</Steps>

`meetings.space.created` é exigido por `spaces.create`. `meetings.space.readonly` resolve URLs/códigos do Meet em espaços. `meetings.space.settings` permite que o OpenClaw forneça configurações de `SpaceConfig`, como `accessType`, durante a criação de salas pela API. `meetings.conference.media.readonly` destina-se à pré-verificação e ao trabalho de mídia da Meet Media API; o Google pode exigir inscrição no Developer Preview para o uso efetivo da Media API. `calendar.events.readonly` é necessário somente para a consulta ao calendário com `--today`/`--event`. `drive.meet.readonly` é necessário somente para a exportação com `--include-doc-bodies`. Se você precisar apenas de entradas pelo Chrome baseadas no navegador, ignore totalmente o OAuth.

### Gerar o token de atualização

Configure `oauth.clientId` e, opcionalmente, `oauth.clientSecret` (ou forneça-os como variáveis de ambiente) e execute:

```bash
openclaw googlemeet auth login --json
```

Isso executa um fluxo PKCE com um retorno de chamada local em `http://localhost:8085/oauth2callback` e imprime um bloco de configuração `oauth` com um token de atualização. Adicione `--manual` para usar um fluxo de copiar/colar quando o navegador não conseguir acessar o retorno de chamada local:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

Saída JSON:

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

Armazene o objeto `oauth` na configuração do Plugin:

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

Prefira variáveis de ambiente quando não quiser armazenar o token de atualização na configuração; a configuração é resolvida primeiro e, depois, o ambiente é usado como alternativa. Se você se autenticou antes de existir o suporte à criação de reuniões, consulta ao calendário ou exportação do corpo de documentos, execute novamente `openclaw googlemeet auth login --json` para que o token de atualização abranja o conjunto atual de escopos.

### Verificar o OAuth com o doctor

```bash
openclaw googlemeet doctor --oauth --json
```

Isso verifica se a configuração OAuth existe e se o token de atualização pode gerar um token de acesso, sem carregar o runtime do Chrome nem exigir um Node conectado. O relatório inclui somente campos de status (`ok`, `configured`, `tokenSource`, `expiresAt`, mensagens de verificação) e nunca imprime o token de acesso, o token de atualização ou o segredo do cliente.

| Verificação          | Significado                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` junto com `oauth.refreshToken`, ou um token de acesso armazenado em cache, está presente |
| `oauth-token`        | O token de acesso armazenado em cache ainda é válido ou o token de atualização gerou um novo             |
| `meet-spaces-get`    | A verificação opcional `--meeting` resolveu um espaço existente do Meet                                  |
| `meet-spaces-create` | A verificação opcional `--create-space` criou um novo espaço do Meet                                      |

Comprove a habilitação da API Meet e o escopo `spaces.create` com a verificação de criação que produz efeito colateral:

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

Comprove o acesso de leitura a um espaço existente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Um `403` nessas verificações geralmente significa que a API REST do Meet está desabilitada, que o token de atualização não tem o escopo necessário ou que a conta do Google não pode acessar esse espaço. Um erro de token de atualização significa que você deve executar novamente `openclaw googlemeet auth login --json` e armazenar o novo bloco `oauth`.

Nenhum OAuth é necessário para o fallback do navegador; nesse caso, a autenticação do Google vem do perfil do Chrome conectado no Node selecionado, não da configuração do OpenClaw.

Estas variáveis de ambiente são aceitas como fallbacks:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` ou `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ou `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ou `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` ou `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` ou `GOOGLE_MEET_PREVIEW_ACK`

### Resolver, fazer a verificação preliminar e ler artefatos

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Depois que o Meet criar os registros de conferência:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Com `--meeting`, `artifacts` e `attendance` usam o registro de conferência mais recente por padrão; passe `--all-conference-records` para incluir todos os registros mantidos.

A consulta do Calendar resolve a URL da reunião no Google Calendar antes de ler os artefatos (requer um token de atualização que inclua o escopo somente leitura de eventos do Calendar):

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Sincronização semanal"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` pesquisa no calendário `primary` de hoje um evento com um link do Meet; `--event <query>` pesquisa textos de eventos correspondentes; `--calendar <id>` direciona a pesquisa a um calendário não primário. `calendar-events` mostra uma prévia dos eventos correspondentes e indica qual deles `latest`/`artifacts`/`attendance`/`export` escolherá.

Se você já souber o ID do registro de conferência, indique-o diretamente:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Feche a sala de um espaço criado pela API:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Chama `spaces.endActiveConference` e requer OAuth com o escopo `meetings.space.created` para um espaço que a conta autorizada possa gerenciar. Aceita uma URL do Meet, um código de reunião ou `spaces/{id}` e primeiro o resolve para o recurso de espaço da API. Isso é separado de `googlemeet leave`: `leave` interrompe a participação local/da sessão do OpenClaw; `end-active-conference` solicita que o Google Meet encerre a conferência ativa do espaço.

Gere um relatório legível:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` retorna os metadados do registro de conferência, além dos metadados de recursos de participantes, gravações, transcrições, entradas estruturadas de transcrição e notas inteligentes, quando o Google os disponibiliza. `--no-transcript-entries` ignora a consulta de entradas em reuniões grandes. `attendance` expande os participantes em linhas de sessão de participante com horários da primeira e última aparição, duração total da sessão, indicadores de atraso/saída antecipada e recursos duplicados de participantes mesclados por usuário conectado ou nome de exibição; `--no-merge-duplicates` mantém os recursos brutos separados, e `--late-after-minutes`/`--early-before-minutes` ajustam os limites.

`export` grava uma pasta com `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` e `manifest.json`. `manifest.json` registra a entrada escolhida, as opções de exportação, os registros de conferência, os arquivos de saída, as contagens, a origem do token, qualquer evento do Calendar usado e os avisos de recuperação parcial. `--zip` também grava um arquivo portátil ao lado da pasta. `--include-doc-bodies` exporta o texto dos Google Docs vinculados de transcrições/notas inteligentes por meio de `files.export` do Drive (requer o escopo somente leitura do Meet no Drive); sem essa opção, as exportações incluem apenas os metadados do Meet e as entradas estruturadas de transcrição. Uma falha parcial de artefato (erro na listagem de notas inteligentes, nas entradas de transcrição ou no corpo do documento) mantém o aviso no resumo/manifesto em vez de causar falha em toda a exportação. `--dry-run` busca os mesmos dados e imprime o JSON do manifesto sem criar a pasta nem o ZIP.

Os agentes usam as mesmas ações por meio da ferramenta `google_meet` (`export`, `create` com `accessType`, `end_active_conference`, `test_listen`); consulte [Ferramenta](#tool).

### Teste rápido em ambiente real

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

| Variável                                                                                                                  | Finalidade                                                              |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `OPENCLAW_LIVE_TEST=1`                                                                                                    | Habilita testes em ambiente real protegidos                             |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                       | URL, código ou `spaces/{id}` mantido do Meet                            |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                | ID do cliente OAuth                                                     |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                        | Token de atualização                                                    |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | Opcional; os mesmos nomes de fallback sem o prefixo `OPENCLAW_` também funcionam |

O teste rápido básico de artefatos/presença requer `meetings.space.readonly` e `meetings.conference.media.readonly`. A consulta do Calendar requer `calendar.events.readonly`. A exportação do corpo de documentos do Drive requer `drive.meet.readonly`.

### Exemplos de criação

```bash
openclaw googlemeet create
```

Exibe o novo URI da reunião, a origem e a sessão de entrada. Com OAuth, usa a API Meet; sem OAuth, usa o perfil conectado do Node do Chrome fixado. JSON do fallback do navegador:

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

Se o fallback do navegador encontrar primeiro a página de login do Google ou um bloqueio de permissão do Meet, `google_meet` retornará detalhes estruturados em vez de uma string simples:

```json
{
  "source": "browser",
  "error": "google-login-required: Faça login no Google no perfil de navegador do OpenClaw e tente criar a reunião novamente.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Faça login no Google no perfil de navegador do OpenClaw e tente criar a reunião novamente.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Fazer login - Contas do Google"
  }
}
```

JSON da criação pela API:

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

A criação entra na reunião por padrão, mas o Chrome/Node do Chrome ainda precisa de um perfil do Google conectado para entrar pelo navegador; se estiver desconectado, o OpenClaw informa `manualActionRequired: true` ou um erro de fallback do navegador e solicita que o operador conclua o login do Google antes de tentar novamente.

Defina `preview.enrollmentAcknowledged: true` somente depois de confirmar que seu projeto do Cloud, a entidade principal OAuth e os participantes da reunião estão inscritos no Google Workspace Developer Preview Program para APIs de mídia do Meet.

## Configuração

O caminho comum do agente do Chrome requer apenas que o plugin esteja habilitado, além do BlackHole, do SoX, de uma chave de provedor em tempo real e de um provedor de TTS do OpenClaw configurado:

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

### Padrões

| Chave                             | Padrão                                   | Observações                                                                                                                                                                                                                     |
| --------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                               |                                                                                                                                                                                                                                 |
| `defaultMode`                     | `"agent"`                                | `"realtime"` é aceito como alias legado de `"agent"`; novos chamadores devem usar `"agent"`                                                                                                                                     |
| `chromeNode.node`                 | não definido                             | ID/nome/IP do Node para `chrome-node`; obrigatório quando mais de um Node compatível puder estar conectado                                                                                                                      |
| `chrome.launch`                   | `true`                                   | Inicia o Chrome para entrar; defina como `false` somente ao reutilizar uma sessão já aberta                                                                                                                                      |
| `chrome.audioBackend`             | `"blackhole-2ch"`                        |                                                                                                                                                                                                                                 |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | Exibido na tela de convidado desconectado do Meet                                                                                                                                                                                |
| `chrome.autoJoin`                 | `true`                                   | Tenta preencher o nome do convidado e clicar em Join Now no `chrome-node`                                                                                                                                                        |
| `chrome.reuseExistingTab`         | `true`                                   | Ativa uma aba existente do Meet em vez de abrir duplicatas                                                                                                                                                                       |
| `chrome.waitForInCallMs`          | `20000`                                  | Aguarda a aba do Meet indicar que está na chamada antes de reproduzir a introdução de resposta por voz                                                                                                                           |
| `chrome.audioFormat`              | `"pcm16-24khz"`                          | Formato de áudio do par de comandos; `"g711-ulaw-8khz"` destina-se somente a pares de comandos legados/personalizados que emitem áudio de telefonia                                                                              |
| `chrome.audioBufferBytes`         | `4096`                                   | Buffer de processamento do SoX para comandos de áudio gerados do par de comandos (metade do buffer padrão de 8192 bytes do SoX, reduzindo a latência do pipe); os valores são limitados a um mínimo de 17 bytes                   |
| `chrome.audioInputCommand`        | comando SoX gerado                       | Lê do CoreAudio `BlackHole 2ch` e grava áudio em `chrome.audioFormat`                                                                                                                                                             |
| `chrome.audioOutputCommand`       | comando SoX gerado                       | Lê áudio em `chrome.audioFormat` e grava no CoreAudio `BlackHole 2ch`                                                                                                                                                             |
| `chrome.bargeInInputCommand`      | não definido                             | Comando opcional do microfone local que grava PCM mono little-endian de 16 bits com sinal para detectar interrupções humanas durante a reprodução do assistente; aplica-se à ponte do par de comandos hospedada pelo Gateway     |
| `chrome.bargeInRmsThreshold`      | `650`                                    | Nível RMS considerado uma interrupção humana                                                                                                                                                                                     |
| `chrome.bargeInPeakThreshold`     | `2500`                                   | Nível de pico considerado uma interrupção humana                                                                                                                                                                                 |
| `chrome.bargeInCooldownMs`        | `900`                                    | Intervalo mínimo entre limpezas repetidas por interrupção                                                                                                                                                                        |
| `mode` (por solicitação)          | `"agent"`                                | Modo de resposta por voz; consulte a tabela [Modos agent e bidi](#agent-and-bidi-modes)                                                                                                                                          |
| `realtime.provider`               | `"openai"`                               | Fallback de compatibilidade usado quando os campos com escopo abaixo não estão definidos                                                                                                                                         |
| `realtime.transcriptionProvider`  | `"openai"`                               | ID do provedor usado pelo modo `agent` para transcrição em tempo real                                                                                                                                                            |
| `realtime.voiceProvider`          | não definido                             | ID do provedor usado pelo modo `bidi` para voz direta em tempo real; defina como `"google"` para o Gemini Live, mantendo a transcrição do modo agent na OpenAI. Combine com `realtime.model` para escolher o modelo específico do Gemini Live. |
| `realtime.toolPolicy`             | `"safe-read-only"`                       | Consulte [Modos agent e bidi](#agent-and-bidi-modes)                                                                                                                                                                             |
| `realtime.instructions`           | instruções breves para respostas faladas | Instrui o modelo a falar brevemente e usar `openclaw_agent_consult` para respostas mais aprofundadas                                                                                                                             |
| `realtime.introMessage`           | `"Say exactly: I'm here and listening."` | Reproduzido uma vez quando a ponte em tempo real se conecta; defina como `""` para entrar silenciosamente                                                                                                                        |
| `realtime.agentId`                | `"main"`                                 | ID do agente OpenClaw usado para `openclaw_agent_consult`                                                                                                                                                                        |
| `voiceCall.enabled`               | `true`                                   | Delega a chamada PSTN do Twilio, o DTMF e a saudação de introdução ao Plugin Voice Call                                                                                                                                          |
| `voiceCall.dtmfDelayMs`           | `12000`                                  | Espera inicial antes de reproduzir pelo Twilio uma sequência DTMF derivada de um PIN                                                                                                                                             |
| `voiceCall.postDtmfSpeechDelayMs` | `5000`                                   | Intervalo antes de solicitar a saudação de introdução em tempo real após o Voice Call iniciar a etapa do Twilio                                                                                                                 |

`chrome.audioBridgeCommand` e `chrome.audioBridgeHealthCommand` permitem que uma ponte externa controle todo o caminho de áudio local em vez de `chrome.audioInputCommand`/`chrome.audioOutputCommand`; consulte [Observações](#notes) para ver a restrição sobre qual modo pode usá-los.

Há uma migração `openclaw doctor --fix` para o formato legado `realtime.provider: "google"`: ela transfere essa intenção para `realtime.voiceProvider: "google"` junto com `realtime.transcriptionProvider: "openai"` quando esses campos ainda não estão definidos.

### Substituições opcionais

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
    model: "gemini-3.1-flash-live-preview",
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

ElevenLabs para escuta e fala no modo agent:

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

A voz persistente do Meet vem de `messages.tts.providers.elevenlabs.speakerVoiceId`. As respostas do agente também podem usar diretivas `[[tts:speakerVoiceId=... model=eleven_v3]]` por resposta quando as substituições do modelo TTS estão habilitadas, mas a configuração é o padrão determinístico para reuniões. Ao entrar, os logs mostram `transcriptionProvider=elevenlabs`, e cada resposta falada registra `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

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

Com `voiceCall.enabled: true` (o padrão) e o transporte Twilio, o Voice Call executa a sequência DTMF antes de abrir o fluxo de mídia em tempo real e, em seguida, usa o texto de introdução salvo como saudação inicial em tempo real. Se `voice-call` não estiver habilitado, o Google Meet ainda poderá validar e registrar o plano de discagem, mas não poderá realizar a chamada pelo Twilio.

Deixe `voiceCall.gatewayUrl` sem definir para usar o runtime local confiável do Gateway, que preserva o
agente invocador durante toda a chamada. Uma URL do Gateway configurada continua sendo um destino WebSocket explícito e
não pode autenticar a proveniência do plugin; entradas de agentes não padrão falham de forma fechada, em vez de usar
silenciosamente outro agente. Execute o Google Meet e o Voice Call no mesmo processo do Gateway quando o roteamento
por agente for necessário.

## Ferramenta

Os agentes usam a ferramenta `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

| `action`                | Finalidade                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `join`                  | Entrar por uma URL explícita do Meet                                                                    |
| `create`                | Criar um espaço (e entrar por padrão); aceita `accessType`/`entryPointAccess`                           |
| `status`                | Listar sessões ativas ou inspecionar uma por `sessionId`                                                |
| `setup_status`          | Executar as mesmas verificações que `googlemeet setup`                                                  |
| `resolve_space`         | Resolver uma URL/código/`spaces/{id}` por meio de `spaces.get`                                          |
| `preflight`             | Validar os pré-requisitos de OAuth e resolução da reunião                                               |
| `latest`                | Encontrar o registro de conferência mais recente de uma reunião                                         |
| `calendar_events`       | Visualizar eventos do Calendar com links do Meet                                                        |
| `artifacts`             | Listar registros de conferência e metadados de participantes/gravações/transcrições/notas inteligentes |
| `attendance`            | Listar participantes e sessões dos participantes                                                       |
| `export`                | Gravar o pacote de artefatos/presença/transcrição/manifesto; defina `"dryRun": true` somente para o manifesto |
| `recover_current_tab`   | Focar/inspecionar uma aba existente do Meet sem abrir outra                                             |
| `transcript`            | Ler a transcrição limitada das legendas; `sinceIndex` retoma do `nextIndex` anterior                    |
| `leave`                 | Encerrar uma sessão (o Chrome clica em Sair; fecha somente as abas que abriu; o Twilio desliga)         |
| `end_active_conference` | Encerrar a conferência ativa do Google Meet em um espaço gerenciado pela API                            |
| `speak`                 | Fazer o agente em tempo real falar imediatamente, usando `sessionId` e `message`                        |
| `test_speech`           | Criar/reutilizar uma sessão, acionar uma frase conhecida e retornar a integridade do Chrome             |
| `test_listen`           | Criar/reutilizar uma sessão somente de observação e aguardar atividade nas legendas/transcrição         |

`test_speech` sempre força `mode: "agent"` ou `"bidi"` e falha se solicitado a executar em `mode: "transcribe"`, pois sessões somente de observação não podem emitir fala. Seu resultado `speechOutputVerified` se baseia no aumento dos bytes de saída de áudio em tempo real durante essa chamada; portanto, uma sessão reutilizada com áudio anterior não conta como uma nova verificação.

Para transportes do Chrome, `leave` mantém aberta uma aba reutilizada pertencente ao usuário após clicar no botão de sair da chamada do Meet. As abas abertas pelo OpenClaw são fechadas após a saída.

Use `transport: "chrome"` quando o Chrome for executado no host do Gateway e `transport: "chrome-node"` quando for executado em um Node pareado. Em ambos os casos, os provedores de modelo e `openclaw_agent_consult` são executados no host do Gateway, portanto as credenciais do modelo permanecem nele. Os logs do modo de agente incluem o provedor/modelo de transcrição resolvido na inicialização da ponte e o provedor/modelo/voz/formato de saída/taxa de amostragem de TTS após cada resposta sintetizada. O `mode: "realtime"` bruto ainda é aceito como alias de compatibilidade legado para `mode: "agent"`, mas não é mais divulgado no enum `mode` da ferramenta.

`create` com uma sala baseada em API e uma política de acesso explícita:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

Encerrando a conferência ativa de uma sala conhecida:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Validação priorizando a escuta antes de afirmar que uma reunião é útil:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Fala sob demanda:

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Diga exatamente: Estou aqui e ouvindo."
}
```

`status` inclui a integridade do Chrome quando disponível:

| Campo                                                                 | Significado                                                                                                                      |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | O Chrome parece estar dentro da chamada do Meet                                                                                  |
| `micMuted`                                                            | Estado aproximado do microfone no Meet                                                                                           |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | O perfil do navegador precisa de login manual, admissão pelo anfitrião do Meet, permissões ou reparo do controle do navegador antes que a fala possa funcionar |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | Se a fala gerenciada do Chrome está permitida agora; `speechReady: false` significa que o OpenClaw não enviou a frase de introdução/teste |
| `providerConnected` / `realtimeReady`                                 | Estado da ponte de voz em tempo real                                                                                             |
| `lastInputAt` / `lastOutputAt`                                        | Último áudio recebido da/enviado para a ponte                                                                                    |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | Se a saída de mídia da aba do Meet foi roteada ativamente para o dispositivo BlackHole da ponte                                 |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | Entrada de loopback ignorada enquanto a reprodução do assistente está ativa                                                      |

## Modos de agente e bidi

| Modo    | Quem decide a resposta           | Caminho da saída de fala                  | Use quando                                                     |
| ------- | -------------------------------- | ----------------------------------------- | -------------------------------------------------------------- |
| `agent` | O agente OpenClaw configurado    | Runtime normal de TTS do OpenClaw         | Você quer o comportamento de "meu agente está na reunião"      |
| `bidi`  | O modelo de voz em tempo real    | Resposta de áudio do provedor em tempo real | Você quer o ciclo de voz conversacional com a menor latência |

Modo `agent`: o provedor de transcrição em tempo real ouve o áudio da reunião, as transcrições finais dos participantes são encaminhadas pelo agente OpenClaw configurado e a resposta é falada pelo TTS normal do OpenClaw. Fragmentos próximos da transcrição final são agrupados antes da consulta para que um único turno falado não produza várias respostas parciais obsoletas; a entrada em tempo real é suprimida enquanto o áudio enfileirado do assistente ainda está sendo reproduzido, e ecos recentes de transcrição semelhantes à fala do assistente são ignorados antes da consulta para que o loopback do BlackHole não faça o agente responder à própria fala.

Modo `bidi`: o modelo de voz em tempo real responde diretamente e pode chamar `openclaw_agent_consult` para raciocínio mais aprofundado, informações atuais ou ferramentas normais do OpenClaw. A ferramenta de consulta executa o agente OpenClaw normal nos bastidores com o contexto recente da transcrição da reunião e retorna uma resposta falada concisa; no modo `agent`, o OpenClaw envia essa resposta diretamente ao TTS; no modo `bidi`, o modelo de voz em tempo real pode reproduzi-la. Ela usa o mesmo mecanismo compartilhado de consulta que o Voice Call.

Por padrão, as consultas são executadas no agente `main`; defina `realtime.agentId` para direcionar uma via do Meet a um workspace de agente dedicado, padrões de modelo, política de ferramentas, memória e histórico de sessões. As consultas do modo de agente usam uma chave de sessão `agent:<id>:subagent:google-meet:<session>` por reunião, para que perguntas de acompanhamento mantenham o contexto da reunião e, ao mesmo tempo, herdem a política normal do agente. Quando um agente chama `google_meet` no modo de agente, a sessão de consulta bifurca a transcrição atual do chamador antes de responder à fala do participante; a sessão do Meet permanece separada para que acompanhamentos da reunião não alterem diretamente a transcrição do chamador.

`realtime.toolPolicy` controla a execução da consulta:

| Política         | Comportamento                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `safe-read-only` | Expõe a ferramenta de consulta; limita o agente normal a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get` |
| `owner`          | Expõe a ferramenta de consulta; permite que o agente normal use sua política normal de ferramentas                                  |
| `none`           | Não expõe a ferramenta de consulta ao modelo de voz em tempo real                                                                   |

A chave da sessão de consulta tem escopo por sessão do Meet, portanto chamadas de consulta subsequentes reutilizam o contexto de consulta anterior durante a mesma reunião.

Force uma verificação falada de prontidão após o Chrome ter entrado completamente:

```bash
openclaw googlemeet speak meet_... "Diga exatamente: Estou aqui e ouvindo."
```

Teste de fumaça completo de entrada e fala:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Diga exatamente: Estou aqui e ouvindo."
```

## Lista de verificação para testes ao vivo

Antes de entregar uma reunião a um agente sem supervisão:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Diga exatamente: Teste de fala do Google Meet concluído."
```

Estado esperado do Chrome-node:

- `googlemeet setup` está totalmente verde e inclui `chrome-node-connected` quando Chrome-node é o transporte padrão ou um Node está fixado.
- `nodes status` mostra o Node selecionado conectado, anunciando `googlemeet.chrome` e `browser.proxy`.
- A aba do Meet entra na reunião, e `test-speech` retorna a integridade do Chrome com `inCall: true`.

Para um host remoto do Chrome, como uma VM macOS do Parallels, a verificação segura mais curta após atualizar o Gateway ou a VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Isso comprova que o plugin do Gateway está carregado, que o Node da VM está conectado com o token atual e que a ponte de áudio do Meet está disponível antes que um agente abra uma aba de reunião real.

Para um teste de fumaça do Twilio, use uma reunião que forneça detalhes de acesso por telefone:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Estado esperado do Twilio:

- `googlemeet setup` inclui verificações verdes de `twilio-voice-call-plugin`, `twilio-voice-call-credentials` e `twilio-voice-call-webhook`.
- `voicecall` fica disponível na CLI após o recarregamento do Gateway.
- A sessão retornada tem `transport: "twilio"` e um `twilio.voiceCallId`.
- `openclaw logs --follow` mostra o TwiML de DTMF sendo servido antes do TwiML em tempo real e, em seguida, uma ponte em tempo real com a saudação inicial na fila.
- `googlemeet leave <sessionId>` encerra a chamada de voz delegada.

## Solução de problemas

### O agente não consegue ver a ferramenta do Google Meet

Confirme que o plugin está habilitado e recarregue o Gateway; o agente em execução só vê as ferramentas de plugin registradas pelo processo atual do Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Em hosts do Gateway que não usam macOS, `google_meet` permanece visível, mas as ações locais de resposta por voz do Chrome são bloqueadas antes de chegarem à ponte de áudio. Use `mode: "transcribe"`, discagem telefônica pelo Twilio ou um host macOS `chrome-node` em vez do caminho padrão do agente local do Chrome.

### Nenhum nó compatível com Google Meet conectado

No host do nó:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

No host do Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

O nó deve estar conectado e listar `googlemeet.chrome` e `browser.proxy`; a configuração do Gateway deve permitir ambos:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Se `googlemeet setup` falhar em `chrome-node-connected` ou o log do Gateway informar `gateway token mismatch`, reinstale ou reinicie o nó com o token atual do Gateway:

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

Execute `googlemeet test-listen` para entradas somente de observação ou `googlemeet test-speech` para entradas em tempo real e, em seguida, inspecione o estado do Chrome retornado. Se algum deles informar `manualActionRequired: true`, mostre `manualActionMessage` ao operador e pare de tentar novamente até que a ação no navegador seja concluída.

Ações manuais comuns: entrar no perfil do Chrome; admitir o convidado pela conta do anfitrião do Meet; conceder permissões de microfone/câmera ao Chrome quando o prompt nativo aparecer; fechar ou corrigir uma caixa de diálogo travada de permissões do Meet.

Não informe "não conectado" apenas porque o Meet pergunta "Do you want people to hear you in the meeting?"; essa é a tela intermediária de escolha de áudio do Meet. O OpenClaw clica em **Use microphone** por meio da automação do navegador quando disponível e continua aguardando o estado real da reunião; no fallback do navegador somente para criação, ele pode clicar em **Continue without microphone**, pois a geração da URL não precisa do caminho de áudio em tempo real.

### Falha na criação da reunião

`googlemeet create` usa `spaces.create` da API do Meet quando o OAuth está configurado; caso contrário, usa o navegador do nó do Chrome fixado. Confirme:

- **Criação pela API**: `oauth.clientId` e `oauth.refreshToken` (ou variáveis de ambiente `OPENCLAW_GOOGLE_MEET_*` correspondentes) estão presentes, e o token de atualização foi gerado depois que o suporte à criação foi adicionado; tokens mais antigos podem não ter `meetings.space.created`, portanto execute novamente `openclaw googlemeet auth login --json`.
- **Fallback do navegador**: `defaultTransport: "chrome-node"` e `chromeNode.node` apontam para um nó conectado com `browser.proxy` e `googlemeet.chrome`; o perfil do Chrome do OpenClaw nesse nó está conectado e consegue abrir `https://meet.google.com/new`.
- **Novas tentativas do fallback do navegador**: reutilize uma guia existente de `.../new` ou de prompt da conta do Google antes de abrir uma nova; tente novamente a chamada da ferramenta em vez de abrir manualmente outra guia.
- **Ação manual**: se a ferramenta retornar `manualActionRequired: true`, use `browser.nodeId`, `browser.targetId`, `browserUrl` e `manualActionMessage` para orientar o operador; não tente novamente em loop.
- **Tela intermediária de escolha de áudio**: se o Meet mostrar "Do you want people to hear you in the meeting?", deixe a guia aberta. O OpenClaw deve clicar em **Use microphone** ou, somente para criação, em **Continue without microphone** e continuar aguardando a URL gerada; se não conseguir, o erro deve mencionar `meet-audio-choice-required`, não `google-login-required`.

### O agente entra, mas não fala

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Use `mode: "agent"` para o caminho STT -> agente do OpenClaw -> TTS e `mode: "bidi"` para o fallback direto de voz em tempo real. `mode: "transcribe"` intencionalmente não inicia nenhuma ponte de resposta por voz. Para depuração somente por observação, execute `openclaw googlemeet status --json <session-id>` depois que os participantes falarem e verifique `captioning`, `transcriptLines` e `lastCaptionText`. Se `inCall` for verdadeiro, mas `transcriptLines` permanecer `0`, as legendas do Meet podem estar desabilitadas, ninguém pode ter falado desde que o observador foi instalado, a interface do Meet pode ter mudado ou as legendas ao vivo podem estar indisponíveis para o idioma ou a conta da reunião.

`googlemeet test-speech` sempre verifica o caminho em tempo real e informa se foram observados bytes de saída da ponte nessa invocação. Se `speechOutputVerified` for falso e `speechOutputTimedOut` for verdadeiro, o provedor em tempo real pode ter aceitado a fala, mas o OpenClaw não detectou novos bytes de saída chegando à ponte de áudio do Chrome.

Verifique também: uma chave de provedor em tempo real (`OPENAI_API_KEY` ou `GEMINI_API_KEY`) está disponível no host do Gateway; `BlackHole 2ch` está visível no host do Chrome; `sox` existe nesse host; o microfone e o alto-falante do Meet estão roteados pelo caminho de áudio virtual (`doctor` deve mostrar `meet output routed: yes` para entradas locais do Chrome em tempo real).

`googlemeet doctor [session-id]` exibe sessão, nó, estado de chamada, motivo da ação manual, conexão do provedor em tempo real, `realtimeReady`, atividade de entrada/saída de áudio, últimos registros de data e hora de áudio, contadores de bytes e URL do navegador. Use `googlemeet status [session-id] --json` para obter o JSON bruto e `googlemeet doctor --oauth` (adicione `--meeting` ou `--create-space`) para verificar a atualização do OAuth sem expor tokens.

Se um agente tiver atingido o tempo limite e uma guia do Meet já estiver aberta, inspecione-a sem abrir outra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

A ação de ferramenta equivalente é `recover_current_tab`: ela focaliza e inspeciona uma guia existente do Meet para o transporte selecionado (controle local do navegador para `chrome`, o nó configurado para `chrome-node`) sem abrir uma nova guia ou sessão e informa o bloqueio atual (login, admissão, permissões ou estado de escolha de áudio). O comando da CLI se comunica com o Gateway configurado, que deve estar em execução; `chrome-node` também exige que o nó esteja conectado.

### Falha nas verificações de configuração do Twilio

`twilio-voice-call-plugin` falha quando `voice-call` não é permitido ou não está habilitado: adicione-o a `plugins.allow`, habilite `plugins.entries.voice-call` e recarregue o Gateway.

`twilio-voice-call-credentials` falha quando o backend do Twilio não tem SID da conta, token de autenticação ou número de origem:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` falha quando `voice-call` não tem exposição pública de Webhook ou quando `publicUrl` aponta para o espaço de rede local ou privado. Não use `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` ou `fd00::/8` como `publicUrl`; os callbacks da operadora não conseguem acessar esses endereços. Defina `plugins.entries.voice-call.config.publicUrl` como uma URL pública ou configure uma exposição por túnel/Tailscale:

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

Para desenvolvimento local, use uma exposição por túnel ou Tailscale em vez de uma URL de host privado:

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

Reinicie ou recarregue o Gateway e, em seguida:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

Por padrão, `voicecall smoke` apenas verifica a prontidão. Faça uma simulação para um número específico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Adicione `--yes` somente para realizar intencionalmente uma chamada real de saída:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### A chamada do Twilio começa, mas nunca entra na reunião

Confirme que o evento do Meet expõe os detalhes da discagem telefônica e informe o número exato de discagem junto com o PIN ou uma sequência DTMF personalizada:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Use `w` no início ou vírgulas em `--dtmf-sequence` para adicionar uma pausa antes do PIN.

Se a chamada for criada, mas a lista de participantes do Meet nunca mostrar o participante conectado por telefone:

- `openclaw googlemeet doctor <session-id>`: confirme o ID da chamada delegada do Twilio, se o DTMF foi colocado na fila e se a saudação introdutória foi solicitada.
- `openclaw voicecall status --call-id <id>`: confirme que a chamada ainda está ativa.
- `openclaw voicecall tail`: confirme que os Webhooks do Twilio estão chegando ao Gateway.
- `openclaw logs --follow`: procure a sequência do Twilio no Meet: o Google Meet delega a entrada, o Voice Call armazena e serve o TwiML de DTMF anterior à conexão, o Voice Call serve o TwiML em tempo real para a chamada do Twilio e, em seguida, o Google Meet solicita a fala introdutória com `voicecall.speak`.
- Execute novamente `openclaw googlemeet setup --transport twilio`; uma verificação de configuração verde é obrigatória, mas não comprova que a sequência do PIN da reunião está correta.
- Confirme que o número de discagem pertence ao mesmo convite e à mesma região do Meet que o PIN.
- Aumente `voiceCall.dtmfDelayMs` em relação ao padrão de 12 segundos se o Meet demorar para atender ou se a transcrição da chamada ainda mostrar o prompt do PIN depois que o DTMF anterior à conexão tiver sido enviado.
- Se o participante entrar, mas você não ouvir a saudação, verifique `openclaw logs --follow` em busca da solicitação `voicecall.speak` posterior ao DTMF e da reprodução de TTS pelo fluxo de mídia ou do fallback `<Say>` do Twilio. Se a transcrição ainda mostrar "enter the meeting PIN", a parte telefônica ainda não entrou na sala do Meet, portanto os participantes não ouvirão a fala.

Se os Webhooks não chegarem, depure primeiro o Plugin Voice Call: o provedor deve conseguir acessar `plugins.entries.voice-call.config.publicUrl` ou o túnel configurado. Consulte [Solução de problemas de chamadas de voz](/pt-BR/plugins/voice-call#troubleshooting).

## Observações

A API de mídia oficial do Google Meet é orientada ao recebimento, portanto falar em uma chamada ainda exige um caminho de participante. Este plugin mantém esse limite visível: o Chrome lida com a participação pelo navegador e o roteamento de áudio local; o Twilio lida com a participação por discagem telefônica.

Os modos de resposta por voz do Chrome precisam de `BlackHole 2ch` e uma das seguintes opções:

- `chrome.audioInputCommand` e `chrome.audioOutputCommand`: o OpenClaw controla a ponte e encaminha o áudio em `chrome.audioFormat` entre esses comandos e o provedor selecionado. O modo `agent` usa transcrição em tempo real com TTS regular; o modo `bidi` usa o provedor de voz em tempo real. O caminho padrão é PCM16 de 24 kHz com `chrome.audioBufferBytes: 4096`; o mu-law G.711 de 8 kHz permanece disponível para pares de comandos legados.
- `chrome.audioBridgeCommand`: um comando de ponte externo controla todo o caminho de áudio local e deve ser encerrado após iniciar ou validar seu daemon. Válido somente para `bidi`, pois o modo `agent` precisa de acesso direto ao par de comandos para TTS.

Com a ponte do Chrome baseada em par de comandos, `chrome.bargeInInputCommand` pode escutar um microfone local separado e interromper a reprodução do assistente quando uma pessoa começa a falar, mantendo a fala humana à frente da saída do assistente mesmo enquanto a entrada de loopback compartilhada do BlackHole é temporariamente suprimida durante a reprodução do assistente. Assim como `chrome.audioInputCommand`/`chrome.audioOutputCommand`, ele é um comando local configurado pelo operador: use um caminho de comando confiável explícito ou uma lista de argumentos, nunca um script de um local não confiável.

Para obter áudio duplex limpo, encaminhe a saída do Meet e o microfone do Meet por dispositivos virtuais separados ou por um grafo de dispositivos virtuais no estilo do Loopback; um único dispositivo BlackHole compartilhado pode devolver o áudio dos outros participantes à chamada, causando eco.

`googlemeet speak` aciona a ponte de áudio de resposta ativa para uma sessão do Chrome; `googlemeet leave` a interrompe (e, para sessões do Twilio delegadas por meio do Voice Call, encerra a chamada subjacente). Use `googlemeet end-active-conference` para também encerrar a conferência ativa do Google Meet em um espaço gerenciado pela API.

## Relacionados

- [Plugin de chamada de voz](/pt-BR/plugins/voice-call)
- [Modo de conversa](/pt-BR/nodes/talk)
- [Criação de plugins](/pt-BR/plugins/building-plugins)
