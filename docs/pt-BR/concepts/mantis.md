---
read_when:
    - Criando ou executando QA visual ao vivo para bugs do OpenClaw
    - Adicionando verificação antes e depois para uma pull request
    - Adicionando cenários de transporte ao vivo do Discord, Slack, WhatsApp ou outros
    - Depuração de execuções de QA que precisam de capturas de tela, automação de navegador ou acesso por VNC
summary: Mantis é o sistema visual de verificação de ponta a ponta para reproduzir bugs do OpenClaw em transportes ao vivo, capturar evidências de antes e depois e anexar artefatos a PRs.
title: Louva-a-deus
x-i18n:
    generated_at: "2026-06-27T17:24:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9de83fac9bfa64b4828dab96fcbf5fac33466c7ede9406472801dc7322bf3ae
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis é o sistema de verificação de ponta a ponta do OpenClaw para bugs que precisam de um
runtime real, um transporte real e prova visível. Ele executa um cenário contra uma ref
sabidamente ruim, captura evidências, executa o mesmo cenário contra uma ref candidata e
publica a comparação como artefatos que um mantenedor pode inspecionar a partir de um PR ou
de um comando local.

Mantis começa com Discord porque Discord nos dá uma primeira trilha de alto valor:
autenticação real de bot, canais reais de guild, reações, threads, comandos nativos e uma
interface de navegador onde humanos podem confirmar visualmente o que o transporte mostrou.

## Objetivos

- Reproduzir um bug de uma issue ou PR do GitHub com o mesmo formato de transporte que os usuários
  veem.
- Capturar um artefato **antes** na ref de linha de base antes de aplicar a correção.
- Capturar um artefato **depois** na ref candidata depois de aplicar a correção.
- Usar um oráculo determinístico sempre que possível, como uma leitura de reação pela REST do Discord
  ou verificação de transcrição do canal.
- Capturar screenshots quando o bug tiver uma superfície de UI visível.
- Executar localmente a partir de uma CLI controlada por agente e remotamente a partir do GitHub.
- Preservar estado de máquina suficiente para resgate por VNC quando login, automação de navegador ou
  autenticação de provedor travar.
- Publicar status conciso em um canal Discord de operador quando a execução estiver bloqueada,
  precisar de ajuda manual via VNC ou terminar.

## Não objetivos

- Mantis não substitui testes unitários. Uma execução do Mantis geralmente deve se tornar
  um teste de regressão menor depois que a correção for compreendida.
- Mantis não é o gate normal de CI rápida. Ele é mais lento, usa credenciais live e
  é reservado para bugs em que o ambiente live importa.
- Mantis não deve exigir um humano para operação normal. VNC manual é um caminho de resgate,
  não o caminho esperado.
- Mantis não armazena segredos brutos em artefatos, logs, screenshots, relatórios Markdown
  ou comentários de PR.

## Propriedade

Mantis vive na pilha de QA do OpenClaw.

- OpenClaw possui o runtime de cenários, adaptadores de transporte, esquema de evidências e
  CLI local em `pnpm openclaw qa mantis`.
- QA Lab possui as peças do harness de transporte live, helpers de captura de navegador e
  gravadores de artefatos.
- Crabbox possui máquinas Linux aquecidas quando uma VM remota é necessária.
- GitHub Actions possui o ponto de entrada do workflow remoto e a retenção de artefatos.
- ClawSweeper possui o roteamento de comentários do GitHub: analisar comandos de mantenedores,
  despachar o workflow e publicar o comentário final do PR.
- Agentes OpenClaw conduzem o Mantis por meio do Codex quando um cenário precisa de configuração
  agêntica, depuração ou relato de estado travado.

Esse limite mantém o conhecimento de transporte no OpenClaw, o agendamento de máquinas no
Crabbox e a integração do workflow de mantenedores no ClawSweeper.

## Formato dos comandos

O primeiro comando local verifica o bot do Discord, guild, canal, envio de mensagem,
envio de reação e caminho de artefatos:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

O executor local de antes e depois aceita este formato:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

O executor cria worktrees destacadas de linha de base e candidata sob o diretório de saída,
instala dependências, compila cada ref, executa o cenário com
`--allow-failures`, depois grava `baseline/`, `candidate/`, `comparison.json`
e `mantis-report.md`. Para o primeiro cenário do Discord, uma verificação bem-sucedida
significa que o status da linha de base é `fail` e o status da candidata é `pass`.

O segundo probe de antes/depois do Discord mira anexos de thread:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Esse cenário publica uma mensagem pai com o bot driver, cria uma thread real do Discord,
chama a ação `message.thread-reply` do OpenClaw com um `filePath` local do repositório,
depois faz polling da thread pela resposta do SUT e pelo nome do arquivo anexado. A
screenshot da linha de base mostra a resposta sem anexo; a screenshot da candidata
mostra o anexo esperado `mantis-thread-report.md`.

O primeiro primitivo de VM/navegador é o smoke de desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Ele aluga ou reutiliza uma máquina desktop Crabbox, inicia um navegador visível dentro da
sessão VNC, captura o desktop, puxa os artefatos de volta para o diretório de saída local
e grava o comando de reconexão no relatório. O comando usa por padrão o provedor Hetzner
porque ele é o primeiro provedor com cobertura desktop/VNC funcional na trilha do Mantis.
Substitua-o com `--provider`, `--crabbox-bin` ou
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` ao executar contra outra frota Crabbox.

Flags úteis do smoke de desktop:

- `--lease-id <cbx_...>` ou `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` reutiliza um desktop aquecido.
- `--browser-url <url>` altera a página aberta no navegador visível.
- `--html-file <path>` renderiza um artefato HTML local do repositório no navegador visível. Mantis usa isso para capturar a linha do tempo gerada de reações de status do Discord por meio de um desktop Crabbox real.
- `--browser-profile-dir <remote-path>` reutiliza um Chrome user-data-dir remoto para que um desktop Mantis persistente possa permanecer logado entre execuções. Use isso para o perfil duradouro do visualizador do Discord Web.
- `--browser-profile-archive-env <name>` restaura um arquivo `.tgz` base64 de Chrome user-data-dir a partir da variável de ambiente nomeada antes de iniciar o navegador. Use isso para testemunhas logadas, como Discord Web. A variável de ambiente padrão é `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` controla a duração da captura MP4. Use uma duração maior para apps web logados e lentos que precisam de tempo para estabilizar.
- `--keep-lease` ou `OPENCLAW_MANTIS_KEEP_VM=1` mantém aberta uma lease recém-criada que passou para inspeção por VNC. Execuções com falha mantêm a lease por padrão quando uma foi criada, para que um operador possa reconectar.
- `--class`, `--idle-timeout` e `--ttl` ajustam o tamanho da máquina e a duração da lease.

Para evidências do Discord Web, Mantis usa uma conta dedicada de visualizador em vez de um
token de bot. O cenário live da API do Discord permanece o oráculo: ele cria a thread real,
envia o `thread-reply` do SUT e verifica o anexo por meio da REST do Discord. Quando
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` está definido, o cenário também
grava um artefato de URL do Discord Web. Quando `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` está
definido, ele deixa essa thread disponível por tempo suficiente para um navegador logado abrir
e gravá-la.

O workflow do GitHub abre a URL da thread candidata no Discord Web, captura uma
screenshot, grava um MP4 e gera uma prévia GIF recortada por movimento quando o ferramental
de mídia do Crabbox está disponível. Prefira um caminho de perfil persistente de visualizador
configurado por meio de `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, porque arquivos de perfil
completos do Chrome podem exceder o limite de tamanho de segredo do GitHub. Para perfis pequenos/de bootstrap,
o workflow também pode restaurar um arquivo `.tgz` base64 a partir de
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Se nenhuma fonte de perfil estiver
configurada, o workflow ainda publica as screenshots determinísticas de anexos da linha de base/candidata
e registra um aviso de que a testemunha logada do Discord Web foi ignorada.

O primeiro primitivo completo de transporte de desktop é o smoke de desktop do Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ele aluga ou reutiliza uma máquina desktop Crabbox, sincroniza o checkout atual para dentro
da VM, executa `pnpm openclaw qa slack` dentro dessa VM, abre Slack Web no navegador VNC,
captura o desktop visível e copia tanto os artefatos de QA do Slack quanto a screenshot VNC
de volta para o diretório de saída local. Esse é o primeiro formato do Mantis em que o Gateway
OpenClaw SUT e o navegador vivem dentro da mesma VM Linux desktop.

Com `--gateway-setup`, o comando prepara uma home persistente descartável do OpenClaw em
`$HOME/.openclaw-mantis/slack-openclaw`, aplica patch na configuração do Slack Socket Mode
para o canal selecionado, inicia `openclaw gateway run` na porta
`38973` e mantém o Chrome em execução na sessão VNC. Esse é o modo "deixe-me um
desktop Linux com Slack e um claw em execução"; a trilha de QA do Slack bot-para-bot
permanece o padrão quando `--gateway-setup` é omitido.

Entradas obrigatórias para `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` para a trilha remota de modelo. Se apenas
  `OPENAI_API_KEY` estiver definido localmente, Mantis o mapeia para `OPENCLAW_LIVE_OPENAI_KEY`
  antes de invocar o Crabbox, para que o encaminhamento de env `OPENCLAW_*` do Crabbox possa levá-lo
  para dentro da VM.

Com `--gateway-setup --credential-source convex`, Mantis aluga a credencial Slack SUT
do pool compartilhado antes de criar a VM e encaminha o id do canal alugado, token de app
Socket Mode e token de bot como env de runtime `OPENCLAW_MANTIS_SLACK_*`
dentro do desktop. Isso mantém os workflows do GitHub leves: eles só precisam
do segredo do broker Convex, não de tokens brutos de bot ou app do Slack.

Flags úteis do desktop Slack:

- `--lease-id <cbx_...>` executa novamente contra uma máquina em que um operador já fez login no Slack Web por VNC.
- `--gateway-setup` inicia um Gateway Slack OpenClaw persistente na VM em vez de apenas executar a trilha de QA bot-para-bot.
- `--keep-lease` mantém a VM do Gateway aberta para inspeção por VNC após sucesso; `--no-keep-lease` a interrompe depois de coletar artefatos.
- `--slack-url <url>` abre uma URL específica do Slack Web. Sem ela, Mantis deriva `https://app.slack.com/client/<team>/<channel>` a partir de `auth.test` do Slack quando o token de bot SUT está disponível.
- `--slack-channel-id <id>` controla a allowlist de canais Slack usada pela configuração do Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controla o perfil persistente do Chrome dentro da VM. O padrão é `$HOME/.config/openclaw-mantis/slack-chrome-profile`, então um login manual no Slack Web sobrevive a novas execuções na mesma lease.
- `--credential-source convex --credential-role ci` usa o pool compartilhado de credenciais em vez de tokens env diretos do Slack.
- `--provider-mode`, `--model`, `--alt-model` e `--fast` são repassados para a trilha live do Slack.

Execuções de checkpoint de aprovação renderizam snapshots de mensagens da API Slack em PNGs
de checkpoint para prova visual segura para CI. `slack-desktop-smoke.png` só é prova do Slack Web
quando a lease usa um perfil de navegador aquecido que já está logado.

O workflow de smoke do GitHub é `Mantis Discord Smoke`. O workflow de antes e depois do GitHub
para o primeiro cenário real é `Mantis Discord Status Reactions`. Ele aceita:

- `baseline_ref`: a ref esperada para reproduzir o comportamento somente em fila.
- `candidate_ref`: a ref esperada para mostrar `queued -> thinking -> done`.

Ele faz checkout da ref do harness de workflow, compila worktrees separadas de linha de base
e candidata, executa `discord-status-reactions-tool-only` contra cada worktree e
faz upload de `baseline/`, `candidate/`, `comparison.json` e `mantis-report.md` como
artefatos do Actions. Ele também renderiza o HTML de linha do tempo de cada trilha em um navegador
desktop Crabbox e publica essas screenshots VNC junto das PNGs determinísticas de linha do tempo
no comentário do PR. O mesmo comentário do PR incorpora prévias GIF leves recortadas por movimento
geradas por `crabbox media preview`, vincula aos clipes MP4 correspondentes recortados por movimento
e mantém os arquivos MP4 completos do desktop para inspeção profunda. As screenshots permanecem
inline para revisão rápida. O workflow compila a CLI Crabbox a partir de
`openclaw/crabbox` main para poder usar as flags atuais de lease desktop/navegador
antes que a próxima release binária do Crabbox seja lançada.

`Mantis Scenario` é o ponto de entrada manual genérico. Ele recebe um `scenario_id`,
`candidate_ref`, `baseline_ref` opcional e `pr_number` opcional, então
despacha o fluxo de trabalho pertencente ao cenário. O wrapper é intencionalmente fino:
os fluxos de trabalho de cenário ainda são donos da configuração de transporte, credenciais, classe de VM,
oráculo esperado e manifesto de artefatos.

`Mantis Slack Desktop Smoke` é o primeiro fluxo de trabalho de VM do Slack. Ele faz checkout da
referência candidata confiável em uma worktree separada, aluga um desktop Linux do Crabbox,
executa `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` contra essa
candidata, abre o Slack Web no navegador VNC, grava o desktop, gera uma
prévia recortada por movimento com `crabbox media preview`, faz upload do diretório
completo de artefatos e, opcionalmente, publica o comentário de evidência embutido no PR de destino.
Por padrão, ele usa AWS para o aluguel do desktop e expõe uma entrada manual de provedor para que
operadores possam mudar para Hetzner quando a capacidade da AWS estiver lenta ou indisponível. Use
esta trilha quando você quiser "um desktop Linux com Slack e uma claw em execução" em vez de
apenas uma transcrição Slack bot a bot.

`Mantis Telegram Live` encapsula a trilha existente de QA ao vivo do Telegram no mesmo pipeline de
evidências de PR. Ele faz checkout da referência candidata confiável em uma
worktree separada, executa `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`, grava um manifesto `mantis-evidence.json` a partir do
resumo de QA do Telegram, `qa-evidence.json` e artefatos de relatório, renderiza o
HTML de evidências redigido por meio de um navegador desktop do Crabbox, gera um
GIF recortado por movimento com `crabbox media preview` e publica o comentário de evidência
embutido no PR quando um número de PR está disponível. Esta trilha é visual de
evidência de QA, não uma prova com Telegram Web autenticado: a Telegram Bot API fornece evidências
estáveis de mensagens ao vivo, mas o estado de login do Telegram Web não é necessário para a automação
normal do Mantis.

`Mantis Telegram Desktop Proof` é o wrapper agêntico nativo de antes/depois do
Telegram Desktop. Um mantenedor pode acioná-lo a partir de um comentário de PR com
`@openclaw-mantis telegram desktop proof`, pela interface do Actions com instruções
livres ou por meio do dispatcher genérico `Mantis Scenario`. O fluxo de trabalho
entrega o PR, a referência de baseline, a referência candidata e as instruções do mantenedor ao Codex.
O agente lê o PR, decide qual comportamento visível no Telegram prova a
mudança, executa a trilha de prova real do Crabbox Telegram Desktop com usuário real para baseline e
candidata, itera até que os GIFs nativos sejam úteis, grava artefatos pareados de
`motionPreview` em `mantis-evidence.json`, faz upload do pacote e
publica uma tabela de evidências de PR em 2 colunas quando um número de PR está disponível.

Para configuração assistida por humano do desktop do Telegram, use o construtor de cenário:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

O construtor aluga ou reutiliza um desktop do Crabbox, instala o binário nativo Linux do
Telegram Desktop, opcionalmente restaura um arquivo de sessão de usuário, configura o
OpenClaw com o token do bot SUT do Telegram alugado, inicia `openclaw gateway run`
na porta `38974`, publica uma mensagem de prontidão do bot driver no grupo privado
alugado, então captura uma captura de tela e MP4 do desktop VNC visível. Um token de bot
nunca faz login no Telegram Desktop; ele apenas configura o OpenClaw. O visualizador de desktop
é uma sessão de usuário do Telegram separada, restaurada de
`--telegram-profile-archive-env <name>` ou criada manualmente por VNC e mantida
ativa com `--keep-lease`.

Flags úteis do construtor de desktop do Telegram:

- `--lease-id <cbx_...>` reexecuta contra uma VM onde um operador já fez login no Telegram Desktop.
- `--telegram-profile-archive-env <name>` lê um arquivo de perfil `.tgz` do Telegram Desktop em base64 dessa variável de ambiente e o restaura antes do lançamento.
- `--telegram-profile-dir <remote-path>` controla o diretório remoto de perfil do Telegram Desktop. O padrão é `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` instala e abre o Telegram Desktop sem configurar o OpenClaw.
- `--credential-source convex --credential-role ci` usa o broker de credenciais compartilhado em vez de tokens diretos de ambiente do Telegram.

Todo cenário que publica em PR grava `mantis-evidence.json` ao lado do relatório.
Este esquema é a passagem de controle entre o código do cenário e os comentários do GitHub:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

Os valores de `path` dos artefatos são relativos ao diretório do manifesto. Os valores de `targetPath`
são caminhos relativos sob o prefixo configurado de artefatos Mantis R2/S3. O
publicador rejeita travessia de caminho e ignora entradas marcadas como `"required": false`
quando prévias ou vídeos opcionais não estão disponíveis.

Tipos de artefato compatíveis:

- `timeline`: captura de tela determinística de cenário, geralmente antes/depois.
- `desktopScreenshot`: captura de tela de desktop VNC/navegador.
- `motionPreview`: GIF animado embutido gerado a partir da gravação do desktop.
- `motionClip`: MP4 recortado por movimento que remove a introdução e o final estáticos.
- `fullVideo`: gravação MP4 completa para inspeção detalhada.
- `metadata`: JSON/log auxiliar.
- `report`: relatório em Markdown.

O publicador reutilizável é `scripts/mantis/publish-pr-evidence.mjs`. Os fluxos de trabalho
o chamam com o manifesto, PR de destino, raiz de destino dos artefatos, marcador de comentário,
URL do artefato do Actions, URL da execução e origem da solicitação. Ele faz upload dos artefatos
declarados para o bucket Mantis R2/S3 configurado, cria um comentário de PR com o resumo primeiro,
imagens/prévias embutidas e vídeos vinculados, então atualiza o comentário com marcador existente
ou cria um novo. Os fluxos de trabalho publicam em `openclaw-crabbox-artifacts`
com URLs públicas sob `https://artifacts.openclaw.ai`. Eles fornecem valores de bucket,
região e URL pública diretamente. O publicador reutilizável exige:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`

Você também pode acionar a execução de reações de status diretamente de um comentário de PR:

```text
@openclaw-mantis discord status reactions
```

O gatilho por comentário é intencionalmente restrito. Ele só roda em comentários de pull request
de usuários com acesso de escrita, manutenção ou admin, e só reconhece
solicitações de reações de status do Discord. Por padrão, ele usa a referência de baseline ruim conhecida
e o SHA HEAD atual do PR como candidata. Mantenedores podem substituir qualquer uma das
referências:

```text
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
```

O QA ao vivo do Telegram também pode ser acionado a partir de um comentário de PR:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Por padrão, ele usa o SHA HEAD atual do PR como candidata e executa
`telegram-status-command`. Mantenedores podem substituir `candidate=...`,
`provider=aws|hetzner` e `lease=<cbx_...>` quando precisarem de uma referência específica ou de um
desktop Crabbox pré-aquecido.

Exemplos de comandos do ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

O primeiro comando é explícito e focado no cenário. O segundo pode, mais tarde, mapear um PR
ou issue para cenários Mantis recomendados a partir de labels, arquivos alterados e
achados de revisão do ClawSweeper.

## Ciclo de vida da execução

1. Adquirir credenciais.
2. Alocar ou reutilizar uma VM.
3. Preparar o perfil de desktop/navegador quando o cenário precisar de evidência de UI.
4. Preparar um checkout limpo para a referência de baseline.
5. Instalar dependências e compilar apenas o que o cenário precisa.
6. Iniciar um OpenClaw Gateway filho com um diretório de estado isolado.
7. Configurar o transporte ao vivo, provedor, modelo e perfil de navegador.
8. Executar o cenário e capturar evidências de baseline.
9. Parar o gateway e preservar logs.
10. Preparar a referência candidata na mesma VM.
11. Executar o mesmo cenário e capturar evidências da candidata.
12. Comparar os resultados do oráculo e as evidências visuais.
13. Gravar Markdown, JSON, logs, capturas de tela e artefatos opcionais de rastreamento.
14. Fazer upload dos artefatos do GitHub Actions.
15. Publicar uma mensagem concisa de status no PR ou Discord.

O cenário deve ser capaz de falhar de duas maneiras diferentes:

- **Bug reproduzido**: o baseline falhou da maneira esperada.
- **Falha do harness**: configuração de ambiente, credenciais, Discord API, navegador ou
  provedor falhou antes que o oráculo do bug fosse significativo.

O relatório final deve separar esses casos para que mantenedores não confundam um ambiente
instável com comportamento do produto.

## MVP do Discord

O primeiro cenário deve mirar reações de status do Discord em canais de guilda onde
o modo de entrega da resposta de origem é `message_tool_only`.

Por que ele é uma boa semente para o Mantis:

- Ele é visível no Discord como reações na mensagem acionadora.
- Ele tem um oráculo REST forte por meio do estado de reação da mensagem do Discord.
- Ele exercita um OpenClaw Gateway real, autenticação de bot do Discord, despacho de mensagens,
  modo de entrega de resposta de origem, estado de reação de status e ciclo de vida de turno do modelo.
- Ele é restrito o suficiente para manter a primeira implementação honesta.

Formato esperado do cenário:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

A evidência de baseline deve mostrar a reação de reconhecimento na fila, mas nenhuma
transição de ciclo de vida no modo somente ferramenta. A evidência da candidata deve mostrar reações de status de
ciclo de vida rodando quando `messages.statusReactions.enabled` está explicitamente
true.

A primeira fatia executável é o cenário de QA ao vivo do Discord com opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Ele configura o SUT com tratamento de guilda sempre ativo, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` e reações de status explícitas. O oráculo
consulta a mensagem acionadora real do Discord e espera a sequência observada
`👀 -> 🤔 -> 👍`. Os artefatos incluem `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` e
`discord-status-reactions-tool-only-timeline.png`.

## Peças de QA existentes

O Mantis deve se apoiar na stack privada de QA existente em vez de começar do
zero:

- `pnpm openclaw qa discord` já executa uma trilha ao vivo do Discord com bots driver e
  SUT.
- O executor de transporte ao vivo já grava relatórios, evidências de QA e
  artefatos específicos de transporte em `.artifacts/qa-e2e/`.
- Aluguéis de credenciais do Convex já fornecem acesso exclusivo a credenciais compartilhadas de
  transporte ao vivo.
- O serviço de controle de navegador já oferece suporte a capturas de tela, snapshots,
  perfis gerenciados headless e perfis CDP remotos.
- O QA Lab já tem uma UI de depuração e bus para testes no formato de transporte.

A primeira implementação do Mantis pode ser um executor fino de antes/depois sobre essas
peças, mais uma camada de evidência visual.

## Modelo de evidência

Toda execução grava um diretório estável de artefatos:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` deve ser a fonte da verdade legível por máquina. O
relatório Markdown é para comentários de PR e revisão humana.

O resumo deve incluir:

- refs e SHAs testados
- transporte e ID do cenário
- provedor da máquina e ID da máquina ou ID de lease
- origem das credenciais sem valores secretos
- resultado da linha de base
- resultado candidato
- se o bug foi reproduzido na linha de base
- se o candidato o corrigiu
- caminhos dos artefatos
- problemas sanitizados de configuração ou limpeza

Capturas de tela são evidências, não segredos. Elas ainda exigem disciplina de
redação: nomes de canais privados, nomes de usuários ou conteúdo de mensagens
podem aparecer. Para PRs públicos, prefira links de artefatos do GitHub Actions
em vez de imagens inline até que a estratégia de redação esteja mais forte.

## Navegador e VNC

A faixa do navegador tem dois modos:

- **Automação headless**: padrão para CI. O Chrome roda com CDP habilitado, e
  Playwright ou o controle de navegador do OpenClaw captura capturas de tela.
- **Resgate por VNC**: habilitado na mesma VM quando login, MFA, antiautomação do
  Discord ou depuração visual precisa de uma pessoa.

O perfil de navegador do observador do Discord deve ser persistente o bastante
para evitar login a cada execução, mas isolado do estado do navegador pessoal. Um
perfil pertence ao pool de máquinas do Mantis, não a um laptop de desenvolvedor.

Quando o Mantis trava, ele publica uma mensagem de status no Discord com:

- ID da execução
- ID do cenário
- provedor da máquina
- diretório de artefatos
- instruções de conexão VNC ou noVNC, se disponíveis
- breve texto do bloqueador

A primeira implantação privada pode publicar essas mensagens no canal de
operadores existente e migrar para um canal dedicado do Mantis depois.

## Máquinas

O Mantis deve preferir AWS por meio do Crabbox para a primeira implementação
remota. O Crabbox nos dá máquinas aquecidas, rastreamento de leases, hidratação,
logs, resultados e limpeza. Se a capacidade da AWS for lenta demais ou
indisponível, adicione um provedor Hetzner por trás da mesma interface de
máquina.

Requisitos mínimos da VM:

- Linux com instalação de Chrome ou Chromium compatível com desktop
- acesso CDP para automação do navegador
- VNC ou noVNC para resgate
- Node 22 e pnpm
- checkout do OpenClaw e cache de dependências
- cache do navegador Chromium do Playwright quando o Playwright for usado
- CPU e memória suficientes para um OpenClaw Gateway, um navegador e uma execução
  de modelo
- acesso de saída ao Discord, GitHub, provedores de modelo e ao broker de
  credenciais

A VM não deve manter segredos brutos de longa duração fora dos armazenamentos de
credenciais ou perfis de navegador esperados.

## Segredos

Segredos ficam em segredos de organização ou repositório do GitHub para
execuções remotas, e em um arquivo secreto local controlado pelo operador para
execuções locais.

Nomes de segredos recomendados:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para uploads públicos de artefatos do GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

No longo prazo, o pool de credenciais Convex deve continuar sendo a fonte normal
para credenciais de transporte live. Segredos do GitHub inicializam o broker e as
faixas de fallback. O workflow de reações de status do Discord mapeia os
segredos do Mantis Crabbox de volta para as variáveis de ambiente
`CRABBOX_COORDINATOR` e `CRABBOX_COORDINATOR_TOKEN` esperadas pela CLI do
Crabbox. Os nomes simples de segredos do GitHub `CRABBOX_*` continuam aceitos
como fallback de compatibilidade.

O executor do Mantis nunca deve imprimir:

- tokens de bot do Discord
- chaves de API de provedores
- cookies do navegador
- conteúdo de perfis de autenticação
- senhas de VNC
- payloads brutos de credenciais

Uploads públicos de artefatos também devem redigir metadados de destino do
Discord, como IDs de bot, guilda, canal e mensagem. O workflow smoke do GitHub
habilita `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` por esse motivo.

Se um token for colado acidentalmente em uma issue, PR, chat ou log, faça a
rotação dele depois que o novo segredo tiver sido armazenado.

## Artefatos do GitHub e comentários de PR

Workflows do Mantis devem enviar o pacote completo de evidências como um
artefato de curta duração do Actions. Quando o workflow é executado para um
relatório de bug ou PR de correção, ele também deve publicar mídia inline
redigida no bucket Mantis R2/S3 configurado e atualizar ou inserir um comentário
nesse bug ou PR de correção com capturas de tela inline de antes/depois. Não
publique a prova principal apenas em um PR genérico de automação de QA. Logs
brutos, mensagens observadas e outras evidências volumosas ficam no artefato do
Actions.

Workflows de produção devem publicar esses comentários com o GitHub App do
Mantis, não com `github-actions[bot]`. Armazene o ID do app e a chave privada
como segredos do GitHub Actions `MANTIS_GITHUB_APP_ID` e
`MANTIS_GITHUB_APP_PRIVATE_KEY`. O workflow usa um marcador oculto como chave de
upsert, atualiza esse comentário quando o token consegue editá-lo e cria um novo
comentário de propriedade do Mantis quando um marcador antigo de propriedade de
bot não pode ser editado.

O comentário do PR deve ser curto e visual:

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Quando a execução falha porque o harness falhou, o comentário deve dizer isso em
vez de sugerir que o candidato falhou.

## Notas de implantação privada

Uma implantação privada pode já ter uma aplicação Discord do Mantis. Reutilize
essa aplicação em vez de criar outro app quando ela tiver as permissões de bot
corretas e puder passar por rotação com segurança.

Defina o canal inicial de notificação do operador por segredos ou configuração de
implantação. Ele pode apontar primeiro para um canal existente de mantenedores ou
operações e depois migrar para um canal dedicado do Mantis quando houver um.

Não coloque IDs de guilda, IDs de canal, tokens de bot, cookies de navegador ou
senhas de VNC neste documento. Armazene-os em segredos do GitHub, no broker de
credenciais ou no armazenamento local de segredos do operador.

## Adicionar um cenário

Um cenário do Mantis deve declarar:

- ID e título
- transporte
- credenciais necessárias
- política de ref da linha de base
- política de ref candidata
- patch de configuração do OpenClaw
- etapas de configuração
- estímulo
- oráculo esperado da linha de base
- oráculo esperado do candidato
- alvos de captura visual
- orçamento de timeout
- etapas de limpeza

Cenários devem preferir oráculos pequenos e tipados:

- estado de reação do Discord para bugs de reação
- referências de mensagens do Discord para bugs de encadeamento
- ts de thread do Slack e estado da API de reações para bugs do Slack
- IDs e cabeçalhos de mensagens de email para bugs de email
- capturas de tela do navegador quando a UI é o único observável confiável

Verificações de visão devem ser aditivas. Se uma API de plataforma conseguir
provar o bug, use a API como oráculo de aprovação/falha e mantenha as capturas de
tela para confiança humana.

## Expansão de provedores

Depois do Discord, o mesmo executor pode adicionar:

- Slack: reações, threads, menções de app, modais, uploads de arquivos.
- Email: autenticação do Gmail e encadeamento de mensagens usando `gog` quando os
  conectores não forem suficientes.
- WhatsApp: login por QR, reidentificação, entrega de mensagens, mídia, reações.
- Telegram: bloqueio por menção em grupo, comandos, reações quando disponíveis.
- Matrix: salas criptografadas, relações de thread ou resposta, retomada após
  reinício.

Cada transporte deve ter um cenário smoke barato e um ou mais cenários por classe
de bug. Cenários visuais caros devem continuar opt-in.

## Perguntas em aberto

- Qual bot do Discord deve ser o driver e qual deve ser o SUT quando o bot
  existente do Mantis for reutilizado?
- O login do navegador observador deve usar uma conta humana do Discord, uma conta
  de teste ou apenas evidência REST legível por bot para a primeira fase?
- Por quanto tempo o GitHub deve reter artefatos do Mantis para PRs?
- Quando o ClawSweeper deve recomendar automaticamente o Mantis em vez de esperar
  por um comando de mantenedor?
- As capturas de tela devem ser redigidas ou cortadas antes do upload para PRs
  públicos?
