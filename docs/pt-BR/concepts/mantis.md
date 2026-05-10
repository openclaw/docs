---
read_when:
    - Criando ou executando QA visual em tempo real para erros do OpenClaw
    - Adicionando verificação antes e depois para uma solicitação de pull
    - Adicionando cenários de transporte em tempo real para Discord, Slack, WhatsApp ou outros
    - Depuração de execuções de QA que precisam de capturas de tela, automação de navegador ou acesso VNC
summary: Mantis é o sistema visual de verificação ponta a ponta para reproduzir bugs do OpenClaw em transportes ao vivo, capturar evidências de antes e depois e anexar artefatos a PRs.
title: Louva-a-deus
x-i18n:
    generated_at: "2026-05-10T19:30:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1622b86cb5e08def1c8f06a16a0f454c67a58cf42f6c08c40bd66754648b9a95
    source_path: concepts/mantis.md
    workflow: 16
---

O Mantis é o sistema de verificação ponta a ponta do OpenClaw para bugs que precisam de um runtime real, um transporte real e prova visível. Ele executa um cenário contra uma ref sabidamente defeituosa, captura evidências, executa o mesmo cenário contra uma ref candidata e publica a comparação como artefatos que um mantenedor pode inspecionar a partir de um PR ou de um comando local.

O Mantis começa com o Discord porque o Discord nos dá uma primeira trilha de alto valor: autenticação real de bot, canais reais de guild, reações, threads, comandos nativos e uma interface de navegador em que humanos podem confirmar visualmente o que o transporte mostrou.

## Objetivos

- Reproduzir um bug de uma issue ou PR do GitHub com o mesmo formato de transporte que os usuários veem.
- Capturar um artefato **antes** na ref de baseline antes de aplicar a correção.
- Capturar um artefato **depois** na ref candidata após aplicar a correção.
- Usar um oráculo determinístico sempre que possível, como uma leitura de reação via REST do Discord ou uma verificação de transcrição do canal.
- Capturar capturas de tela quando o bug tiver uma superfície de UI visível.
- Executar localmente a partir de uma CLI controlada por agente e remotamente a partir do GitHub.
- Preservar estado de máquina suficiente para resgate por VNC quando login, automação de navegador ou autenticação de provedor travar.
- Publicar status conciso em um canal de operador no Discord quando a execução estiver bloqueada, precisar de ajuda manual via VNC ou terminar.

## Fora de escopo

- O Mantis não substitui testes unitários. Uma execução do Mantis normalmente deve se tornar um teste de regressão menor depois que a correção for compreendida.
- O Mantis não é o gate normal e rápido de CI. Ele é mais lento, usa credenciais ao vivo e é reservado para bugs em que o ambiente ao vivo importa.
- O Mantis não deve exigir um humano para operação normal. VNC manual é um caminho de resgate, não o caminho feliz.
- O Mantis não armazena segredos brutos em artefatos, logs, capturas de tela, relatórios Markdown ou comentários de PR.

## Propriedade

O Mantis faz parte da pilha de QA do OpenClaw.

- O OpenClaw possui o runtime de cenário, os adaptadores de transporte, o esquema de evidências e a CLI local em `pnpm openclaw qa mantis`.
- O QA Lab possui as partes do harness de transporte ao vivo, os auxiliares de captura de navegador e os gravadores de artefatos.
- O Crabbox possui máquinas Linux aquecidas quando uma VM remota é necessária.
- O GitHub Actions possui o ponto de entrada do workflow remoto e a retenção de artefatos.
- O ClawSweeper possui o roteamento de comentários do GitHub: analisar comandos de mantenedores, despachar o workflow e publicar o comentário final no PR.
- Agentes do OpenClaw conduzem o Mantis pelo Codex quando um cenário precisa de configuração agêntica, depuração ou relatório de estado travado.

Esse limite mantém o conhecimento de transporte no OpenClaw, o agendamento de máquinas no Crabbox e a cola do workflow de mantenedores no ClawSweeper.

## Formato do comando

O primeiro comando local verifica o bot do Discord, guild, canal, envio de mensagem, envio de reação e caminho de artefato:

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

O executor cria worktrees destacados de baseline e candidata sob o diretório de saída, instala dependências, compila cada ref, executa o cenário com `--allow-failures` e então grava `baseline/`, `candidate/`, `comparison.json` e `mantis-report.md`. Para o primeiro cenário do Discord, uma verificação bem-sucedida significa que o status do baseline é `fail` e o status da candidata é `pass`.

A segunda sondagem antes/depois do Discord mira anexos em threads:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Esse cenário publica uma mensagem pai com o bot controlador, cria uma thread real do Discord, chama a ação `message.thread-reply` do OpenClaw com um `filePath` local ao repositório e então consulta a thread pela resposta do SUT e pelo nome de arquivo do anexo. A captura de tela do baseline mostra a resposta sem anexo; a captura de tela da candidata mostra o anexo esperado `mantis-thread-report.md`.

O primeiro primitivo de VM/navegador é o smoke de desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Ele aluga ou reutiliza uma máquina desktop do Crabbox, inicia um navegador visível dentro da sessão VNC, captura o desktop, traz os artefatos de volta para o diretório de saída local e grava o comando de reconexão no relatório. O comando usa por padrão o provedor Hetzner porque ele é o primeiro provedor com cobertura funcional de desktop/VNC na trilha do Mantis. Sobrescreva com `--provider`, `--crabbox-bin` ou `OPENCLAW_MANTIS_CRABBOX_PROVIDER` ao executar contra outra frota do Crabbox.

Flags úteis do smoke de desktop:

- `--lease-id <cbx_...>` ou `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` reutiliza um desktop aquecido.
- `--browser-url <url>` altera a página aberta no navegador visível.
- `--html-file <path>` renderiza um artefato HTML local ao repositório no navegador visível. O Mantis usa isso para capturar a linha do tempo gerada de reações de status do Discord por meio de um desktop real do Crabbox.
- `--browser-profile-dir <remote-path>` reutiliza um user-data-dir remoto do Chrome para que um desktop persistente do Mantis possa permanecer logado entre execuções. Use isso para o perfil de visualizador de longa duração do Discord Web.
- `--browser-profile-archive-env <name>` restaura um arquivo `.tgz` base64 de user-data-dir do Chrome a partir da variável de ambiente nomeada antes de iniciar o navegador. Use isso para testemunhas logadas, como o Discord Web. A variável de ambiente padrão é `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` controla a duração da captura MP4. Use uma duração maior para apps web logados lentos que precisam de tempo para estabilizar.
- `--keep-lease` ou `OPENCLAW_MANTIS_KEEP_VM=1` mantém um lease recém-criado e bem-sucedido aberto para inspeção via VNC. Execuções com falha mantêm o lease por padrão quando um foi criado para que um operador possa reconectar.
- `--class`, `--idle-timeout` e `--ttl` ajustam o tamanho da máquina e a duração do lease.

Para evidência no Discord Web, o Mantis usa uma conta de visualizador dedicada em vez de um token de bot. O cenário de API ao vivo do Discord continua sendo o oráculo: ele cria a thread real, envia o `thread-reply` do SUT e verifica o anexo via REST do Discord. Quando `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` está definido, o cenário também grava um artefato de URL do Discord Web. Quando `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` está definido, ele deixa essa thread disponível por tempo suficiente para um navegador logado abri-la e gravá-la.

O workflow do GitHub abre a URL da thread candidata no Discord Web, captura uma captura de tela, grava um MP4 e gera uma prévia GIF aparada por movimento quando as ferramentas de mídia do Crabbox estão disponíveis. Prefira um caminho de perfil de visualizador persistente configurado por meio de `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, porque arquivos completos de perfil do Chrome podem ultrapassar o limite de tamanho de segredos do GitHub. Para perfis pequenos/de bootstrap, o workflow também pode restaurar um arquivo `.tgz` base64 a partir de `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Se nenhuma fonte de perfil estiver configurada, o workflow ainda publica as capturas de tela determinísticas de anexos do baseline/candidata e registra um aviso de que a testemunha logada do Discord Web foi ignorada.

O primeiro primitivo completo de transporte em desktop é o smoke de desktop do Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ele aluga ou reutiliza uma máquina desktop do Crabbox, sincroniza o checkout atual na VM, executa `pnpm openclaw qa slack` dentro dessa VM, abre o Slack Web no navegador VNC, captura o desktop visível e copia tanto os artefatos de QA do Slack quanto a captura de tela VNC de volta para o diretório de saída local. Esse é o primeiro formato do Mantis em que o Gateway do SUT OpenClaw e o navegador vivem ambos dentro da mesma VM Linux desktop.

Com `--gateway-setup`, o comando prepara um home persistente e descartável do OpenClaw em `$HOME/.openclaw-mantis/slack-openclaw`, corrige a configuração do Slack Socket Mode para o canal selecionado, inicia `openclaw gateway run` na porta `38973` e mantém o Chrome em execução na sessão VNC. Esse é o modo "deixe-me um desktop Linux com Slack e uma claw em execução"; a trilha de QA bot-para-bot do Slack continua sendo o padrão quando `--gateway-setup` é omitido.

Entradas obrigatórias para `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` para a trilha de modelo remoto. Se apenas `OPENAI_API_KEY` estiver definido localmente, o Mantis o mapeia para `OPENCLAW_LIVE_OPENAI_KEY` antes de invocar o Crabbox para que o encaminhamento de env `OPENCLAW_*` do Crabbox possa levá-lo para dentro da VM.

Com `--gateway-setup --credential-source convex`, o Mantis aluga a credencial SUT do Slack do pool compartilhado antes de criar a VM e encaminha o id do canal alugado, o token de app do Socket Mode e o token de bot como env de runtime `OPENCLAW_MANTIS_SLACK_*` dentro do desktop. Isso mantém os workflows do GitHub enxutos: eles precisam apenas do segredo do broker Convex, não de tokens brutos de bot ou app do Slack.

Flags úteis de desktop do Slack:

- `--lease-id <cbx_...>` reexecuta contra uma máquina em que um operador já fez login no Slack Web via VNC.
- `--gateway-setup` inicia um Gateway persistente do OpenClaw para Slack na VM em vez de executar apenas a trilha de QA bot-para-bot.
- `--keep-lease` mantém a VM do Gateway aberta para inspeção via VNC após sucesso; `--no-keep-lease` a encerra depois de coletar artefatos.
- `--slack-url <url>` abre uma URL específica do Slack Web. Sem ela, o Mantis deriva `https://app.slack.com/client/<team>/<channel>` de `auth.test` do Slack quando o token de bot do SUT está disponível.
- `--slack-channel-id <id>` controla a allowlist de canais do Slack usada pela configuração do Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controla o perfil persistente do Chrome dentro da VM. O padrão é `$HOME/.config/openclaw-mantis/slack-chrome-profile`, para que um login manual no Slack Web sobreviva a reexecuções no mesmo lease.
- `--credential-source convex --credential-role ci` usa o pool de credenciais compartilhado em vez de tokens env diretos do Slack.
- `--provider-mode`, `--model`, `--alt-model` e `--fast` são repassados para a trilha ao vivo do Slack.

O workflow smoke do GitHub é `Mantis Discord Smoke`. O workflow antes e depois do GitHub para o primeiro cenário real é `Mantis Discord Status Reactions`. Ele aceita:

- `baseline_ref`: a ref que se espera reproduzir o comportamento apenas em fila.
- `candidate_ref`: a ref que se espera mostrar `queued -> thinking -> done`.

Ele faz checkout da ref do harness de workflow, compila worktrees separados de baseline e candidata, executa `discord-status-reactions-tool-only` contra cada worktree e envia `baseline/`, `candidate/`, `comparison.json` e `mantis-report.md` como artefatos do Actions. Ele também renderiza o HTML da linha do tempo de cada trilha em um navegador desktop do Crabbox e publica essas capturas de tela VNC junto das PNGs determinísticas da linha do tempo no comentário do PR. O mesmo comentário incorpora prévias GIF leves aparadas por movimento geradas por `crabbox media preview`, cria links para os clipes MP4 correspondentes aparados por movimento e mantém os arquivos MP4 completos do desktop para inspeção profunda. As capturas de tela permanecem inline para revisão rápida. O workflow compila a CLI do Crabbox a partir de `openclaw/crabbox` main para poder usar as flags atuais de lease de desktop/navegador antes do próximo lançamento do binário do Crabbox ser cortado.

`Mantis Scenario` é o ponto de entrada manual genérico. Ele recebe um `scenario_id`, `candidate_ref`, `baseline_ref` opcional e `pr_number` opcional, e então despacha o workflow pertencente ao cenário. O wrapper é intencionalmente fino: os workflows de cenário ainda são donos de sua configuração de transporte, credenciais, classe de VM, oráculo esperado e manifesto de artefatos.

`Mantis Slack Desktop Smoke` é o primeiro fluxo de trabalho de VM do Slack. Ele faz checkout da
ref candidata confiável em uma worktree separada, aluga uma área de trabalho Linux do Crabbox,
executa `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` contra essa
candidata, abre o Slack Web no navegador VNC, grava a área de trabalho, gera uma
prévia com corte por movimento usando `crabbox media preview`, faz upload do diretório
completo de artefatos e, opcionalmente, publica o comentário de evidência embutido no PR alvo.
Por padrão, ele usa AWS para o aluguel da área de trabalho e expõe uma entrada manual de provedor para que
operadores possam alternar para Hetzner quando a capacidade da AWS estiver lenta ou indisponível. Use
esta via quando você quiser "uma área de trabalho Linux com Slack e um claw em execução" em vez
de apenas uma transcrição Slack de bot para bot.

`Mantis Telegram Live` encapsula a via de QA ao vivo existente do Telegram no mesmo pipeline de
evidência de PR. Ele faz checkout da ref candidata confiável em uma worktree
separada, executa `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`, grava um manifesto `mantis-evidence.json` a partir do
resumo de QA do Telegram e do artefato de mensagem observada, renderiza o HTML da
transcrição redigida por meio de um navegador de área de trabalho do Crabbox, gera um GIF com corte por movimento
usando `crabbox media preview` e publica o comentário de evidência embutido no PR quando um número de PR
está disponível. Esta via é visual de transcrição, não uma prova do Telegram Web com login: a Telegram Bot API fornece evidência
estável de mensagens ao vivo, mas o estado de login do Telegram Web não é necessário para a automação normal do Mantis.

Para configuração da área de trabalho do Telegram com humano no loop, use o construtor de cenário:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

O construtor aluga ou reutiliza uma área de trabalho Crabbox, instala o binário nativo do Linux
Telegram Desktop, restaura opcionalmente um arquivo de sessão de usuário, configura
OpenClaw com o token do bot SUT do Telegram alugado, inicia `openclaw gateway run`
na porta `38974`, publica uma mensagem de prontidão do bot controlador no grupo privado
alugado e então captura uma captura de tela e MP4 da área de trabalho VNC visível. Um token de
bot nunca faz login no Telegram Desktop; ele apenas configura o OpenClaw. O visualizador da área de trabalho
é uma sessão de usuário separada do Telegram restaurada de
`--telegram-profile-archive-env <name>` ou criada manualmente via VNC e mantida
ativa com `--keep-lease`.

Flags úteis do construtor de área de trabalho do Telegram:

- `--lease-id <cbx_...>` reexecuta contra uma VM onde um operador já fez login no Telegram Desktop.
- `--telegram-profile-archive-env <name>` lê um arquivo de perfil `.tgz` do Telegram Desktop em base64 dessa variável de ambiente e o restaura antes da inicialização.
- `--telegram-profile-dir <remote-path>` controla o diretório remoto de perfil do Telegram Desktop. O padrão é `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` instala e abre o Telegram Desktop sem configurar o OpenClaw.
- `--credential-source convex --credential-role ci` usa o intermediador de credenciais compartilhado em vez de tokens diretos de ambiente do Telegram.

Todo cenário de publicação em PR grava `mantis-evidence.json` ao lado do seu relatório.
Este esquema é a passagem entre o código de cenário e os comentários do GitHub:

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
são caminhos relativos sob o diretório de publicação alvo do branch `qa-artifacts`.
O publicador rejeita travessia de caminhos e ignora entradas marcadas como
`"required": false` quando prévias ou vídeos opcionais estão indisponíveis.

Tipos de artefato compatíveis:

- `timeline`: captura de tela determinística do cenário, normalmente antes/depois.
- `desktopScreenshot`: captura de tela da área de trabalho VNC/navegador.
- `motionPreview`: GIF animado embutido gerado a partir da gravação da área de trabalho.
- `motionClip`: MP4 com corte por movimento que remove a introdução e o fim estáticos.
- `fullVideo`: gravação MP4 completa para inspeção aprofundada.
- `metadata`: anexo JSON/log.
- `report`: relatório Markdown.

O publicador reutilizável é `scripts/mantis/publish-pr-evidence.mjs`. Os fluxos de trabalho
o chamam com o manifesto, PR alvo, raiz alvo de `qa-artifacts`, marcador de comentário,
URL do artefato do Actions, URL da execução e origem da solicitação. Ele copia os artefatos declarados
para o branch `qa-artifacts`, cria um comentário de PR com resumo primeiro, com imagens/prévias
embutidas e vídeos vinculados, e então atualiza o comentário com marcador existente ou
cria um.

Você também pode acionar a execução de status-reactions diretamente a partir de um comentário de PR:

```text
@Mantis discord status reactions
```

O gatilho por comentário é intencionalmente restrito. Ele só executa em comentários de pull request
de usuários com acesso de escrita, manutenção ou administração, e só reconhece
solicitações de reações de status do Discord. Por padrão, ele usa a ref de linha de base ruim conhecida
e o SHA atual do cabeçalho do PR como candidato. Mantenedores podem substituir qualquer uma das
refs:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

QA ao vivo do Telegram também pode ser acionado a partir de um comentário de PR:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Por padrão, ele usa o SHA atual do cabeçalho do PR como candidato e executa
`telegram-status-command`. Mantenedores podem substituir `candidate=...`,
`provider=aws|hetzner` e `lease=<cbx_...>` quando precisarem de uma ref específica ou de uma
área de trabalho Crabbox pré-aquecida.

Exemplos de comandos do ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

O primeiro comando é explícito e focado no cenário. O segundo pode, mais tarde, mapear um PR
ou issue para cenários Mantis recomendados a partir de rótulos, arquivos alterados e
achados de revisão do ClawSweeper.

## Ciclo de vida da execução

1. Obter credenciais.
2. Alocar ou reutilizar uma VM.
3. Preparar o perfil da área de trabalho/navegador quando o cenário precisar de evidência de UI.
4. Preparar um checkout limpo para a ref de linha de base.
5. Instalar dependências e compilar apenas o que o cenário precisa.
6. Iniciar um Gateway OpenClaw filho com um diretório de estado isolado.
7. Configurar o transporte ao vivo, provedor, modelo e perfil do navegador.
8. Executar o cenário e capturar evidência de linha de base.
9. Parar o gateway e preservar logs.
10. Preparar a ref candidata na mesma VM.
11. Executar o mesmo cenário e capturar evidência da candidata.
12. Comparar os resultados do oráculo e a evidência visual.
13. Gravar Markdown, JSON, logs, capturas de tela e artefatos de rastreamento opcionais.
14. Fazer upload de artefatos do GitHub Actions.
15. Publicar uma mensagem concisa de status no PR ou Discord.

O cenário deve poder falhar de duas maneiras diferentes:

- **Bug reproduzido**: a linha de base falhou da maneira esperada.
- **Falha do harness**: configuração do ambiente, credenciais, Discord API, navegador ou
  provedor falharam antes que o oráculo do bug fosse significativo.

O relatório final deve separar esses casos para que mantenedores não confundam um ambiente instável
com comportamento do produto.

## MVP do Discord

O primeiro cenário deve mirar reações de status do Discord em canais de guilda onde
o modo de entrega da resposta de origem é `message_tool_only`.

Por que ele é uma boa semente do Mantis:

- É visível no Discord como reações na mensagem acionadora.
- Tem um oráculo REST forte por meio do estado de reação da mensagem do Discord.
- Exercita um Gateway OpenClaw real, autenticação de bot do Discord, despacho de mensagem,
  modo de entrega de resposta de origem, estado de reação de status e ciclo de vida do turno do modelo.
- É restrito o suficiente para manter a primeira implementação honesta.

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

A evidência de linha de base deve mostrar a reação de confirmação enfileirada, mas nenhuma
transição de ciclo de vida no modo somente ferramenta. A evidência da candidata deve mostrar reações
de status de ciclo de vida em execução quando `messages.statusReactions.enabled` está explicitamente
true.

A primeira fatia executável é o cenário de QA ao vivo do Discord com adesão explícita:

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

## Componentes de QA existentes

O Mantis deve se apoiar na pilha privada de QA existente em vez de começar do
zero:

- `pnpm openclaw qa discord` já executa uma via ao vivo do Discord com bots controlador e
  SUT.
- O executor de transporte ao vivo já grava relatórios e artefatos de mensagens observadas
  em `.artifacts/qa-e2e/`.
- Aluguéis de credenciais do Convex já fornecem acesso exclusivo a credenciais compartilhadas
  de transporte ao vivo.
- O serviço de controle de navegador já é compatível com capturas de tela, snapshots,
  perfis gerenciados headless e perfis CDP remotos.
- O QA Lab já tem uma UI de depurador e barramento para testes no formato de transporte.

A primeira implementação do Mantis pode ser um executor fino de antes/depois sobre esses
componentes, mais uma camada de evidência visual.

## Modelo de evidência

Toda execução grava um diretório de artefatos estável:

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
- transporte e id do cenário
- provedor de máquina e id da máquina ou id do aluguel
- origem das credenciais sem valores secretos
- resultado da linha de base
- resultado da candidata
- se o bug foi reproduzido na linha de base
- se a candidata o corrigiu
- caminhos dos artefatos
- problemas de configuração ou limpeza sanitizados

Capturas de tela são evidência, não segredos. Ainda precisam de disciplina de redação:
nomes de canais privados, nomes de usuários ou conteúdo de mensagens podem aparecer. Para PRs públicos,
prefira links de artefatos do GitHub Actions em vez de imagens embutidas até que a história de redação
esteja mais forte.

## Navegador e VNC

A via de navegador tem dois modos:

- **Automação headless**: padrão para CI. O Chrome executa com CDP habilitado, e
  o Playwright ou o controle de navegador do OpenClaw captura capturas de tela.
- **Resgate por VNC**: habilitado na mesma VM quando login, MFA, anti-automação do Discord
  ou depuração visual exigem um humano.

O perfil do navegador observador do Discord deve ser persistente o suficiente para evitar
login em toda execução, mas isolado do estado pessoal do navegador. Um perfil
pertence ao pool de máquinas Mantis, não ao laptop de um desenvolvedor.

Quando o Mantis fica preso, ele publica uma mensagem de status no Discord com:

- id da execução
- id do cenário
- provedor de máquina
- diretório de artefatos
- instruções de conexão VNC ou noVNC, se disponíveis
- breve texto do bloqueador

A primeira implantação privada pode publicar essas mensagens no canal de operador existente e migrar para um canal dedicado do Mantis posteriormente.

## Máquinas

O Mantis deve preferir AWS por meio do Crabbox para a primeira implementação remota. O Crabbox nos oferece máquinas aquecidas, rastreamento de concessões, hidratação, logs, resultados e limpeza. Se a capacidade da AWS estiver lenta demais ou indisponível, adicione um provedor Hetzner por trás da mesma interface de máquina.

Requisitos mínimos da VM:

- Linux com uma instalação do Chrome ou Chromium compatível com desktop
- acesso CDP para automação de navegador
- VNC ou noVNC para resgate
- Node 22 e pnpm
- checkout do OpenClaw e cache de dependências
- cache do navegador Playwright Chromium quando o Playwright for usado
- CPU e memória suficientes para um OpenClaw Gateway, um navegador e uma execução de modelo
- acesso de saída ao Discord, GitHub, provedores de modelos e ao intermediador de credenciais

A VM não deve manter segredos brutos de longa duração fora dos armazenamentos esperados de credenciais ou perfis de navegador.

## Segredos

Os segredos ficam nos segredos da organização ou do repositório do GitHub para execuções remotas e em um arquivo de segredos local controlado pelo operador para execuções locais.

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

No longo prazo, o pool de credenciais do Convex deve continuar sendo a fonte normal para credenciais de transporte ao vivo. Os segredos do GitHub inicializam o intermediador e as vias de fallback. O fluxo de trabalho de reações de status do Discord mapeia os segredos do Mantis Crabbox de volta para as variáveis de ambiente `CRABBOX_COORDINATOR` e `CRABBOX_COORDINATOR_TOKEN` esperadas pela CLI do Crabbox. Os nomes simples de segredos do GitHub `CRABBOX_*` continuam aceitos como fallback de compatibilidade.

O executor do Mantis nunca deve imprimir:

- tokens de bots do Discord
- chaves de API de provedores
- cookies de navegador
- conteúdo de perfis de autenticação
- senhas de VNC
- payloads brutos de credenciais

Uploads públicos de artefatos também devem redigir metadados de destino do Discord, como ids de bot, guilda, canal e mensagem. O fluxo de trabalho de smoke do GitHub habilita `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` por esse motivo.

Se um token for colado acidentalmente em uma issue, PR, chat ou log, rotacione-o depois que o novo segredo tiver sido armazenado.

## Artefatos do GitHub e comentários de PR

Os fluxos de trabalho do Mantis devem enviar o pacote completo de evidências como um artefato de curta duração do Actions. Quando o fluxo de trabalho for executado para um relatório de bug ou PR de correção, ele também deve publicar as capturas de tela PNG redigidas no branch `qa-artifacts` e inserir ou atualizar um comentário nessa issue de bug ou PR de correção com capturas de tela antes/depois embutidas. Não publique a prova principal apenas em um PR genérico de automação de QA. Logs brutos, mensagens observadas e outras evidências volumosas permanecem no artefato do Actions.

Fluxos de trabalho de produção devem publicar esses comentários com o GitHub App do Mantis, não com `github-actions[bot]`. Armazene o id do app e a chave privada como segredos do GitHub Actions `MANTIS_GITHUB_APP_ID` e `MANTIS_GITHUB_APP_PRIVATE_KEY`. O fluxo de trabalho usa um marcador oculto como chave de inserção/atualização, atualiza esse comentário quando o token consegue editá-lo e cria um novo comentário pertencente ao Mantis quando um marcador antigo pertencente a um bot não pode ser editado.

O comentário de PR deve ser curto e visual:

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

Quando a execução falhar porque o harness falhou, o comentário deve dizer isso em vez de sugerir que o candidato falhou.

## Notas de implantação privada

Uma implantação privada pode já ter uma aplicação do Mantis no Discord. Reutilize essa aplicação em vez de criar outro app quando ela tiver as permissões de bot corretas e puder ser rotacionada com segurança.

Defina o canal inicial de notificação do operador por meio de segredos ou configuração de implantação. Ele pode apontar primeiro para um canal existente de mantenedores ou operações e depois migrar para um canal dedicado do Mantis quando houver um.

Não coloque ids de guilda, ids de canal, tokens de bot, cookies de navegador ou senhas de VNC neste documento. Armazene-os em segredos do GitHub, no intermediador de credenciais ou no armazenamento local de segredos do operador.

## Adicionando um cenário

Um cenário do Mantis deve declarar:

- id e título
- transporte
- credenciais necessárias
- política de ref da linha de base
- política de ref do candidato
- patch de configuração do OpenClaw
- etapas de configuração
- estímulo
- oráculo esperado da linha de base
- oráculo esperado do candidato
- alvos de captura visual
- orçamento de tempo limite
- etapas de limpeza

Os cenários devem preferir oráculos pequenos e tipados:

- estado de reação do Discord para bugs de reação
- referências de mensagens do Discord para bugs de threading
- ts da thread do Slack e estado da API de reações para bugs do Slack
- ids e cabeçalhos de mensagens de email para bugs de email
- capturas de tela do navegador quando a UI for o único observável confiável

Verificações por visão devem ser aditivas. Se uma API de plataforma puder provar o bug, use a API como oráculo de aprovação/reprovação e mantenha as capturas de tela para confiança humana.

## Expansão de provedores

Depois do Discord, o mesmo executor pode adicionar:

- Slack: reações, threads, menções ao app, modais, uploads de arquivos.
- Email: autenticação do Gmail e threading de mensagens usando `gog` quando conectores não forem suficientes.
- WhatsApp: login por QR, reidentificação, entrega de mensagens, mídia, reações.
- Telegram: controle de menções em grupo, comandos, reações quando disponíveis.
- Matrix: salas criptografadas, relações de thread ou resposta, retomada após reinicialização.

Cada transporte deve ter um cenário de smoke barato e um ou mais cenários por classe de bug. Cenários visuais caros devem permanecer opt-in.

## Perguntas em aberto

- Qual bot do Discord deve ser o driver e qual deve ser o SUT quando o bot existente do Mantis for reutilizado?
- O login do navegador observador deve usar uma conta humana do Discord, uma conta de teste ou apenas evidências REST legíveis por bot na primeira fase?
- Por quanto tempo o GitHub deve reter artefatos do Mantis para PRs?
- Quando o ClawSweeper deve recomendar automaticamente o Mantis em vez de esperar um comando de mantenedor?
- As capturas de tela devem ser redigidas ou recortadas antes do upload para PRs públicos?
