---
read_when:
    - Criar ou executar QA visual ao vivo para erros do OpenClaw
    - Adicionando verificação antes e depois a uma solicitação de pull
    - Adicionando cenários de transporte em tempo real para Discord, Slack, WhatsApp ou outros
    - Depuração de execuções de QA que precisam de capturas de tela, automação de navegador ou acesso VNC
summary: Mantis é o sistema visual de verificação de ponta a ponta para reproduzir bugs do OpenClaw em transportes ao vivo, capturar evidências de antes e depois e anexar artefatos aos PRs.
title: Mantis
x-i18n:
    generated_at: "2026-05-11T20:27:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 465ed7c994e8821fc64ca46a58de46cbec8b4ba687862b00398f7b0d22d62b44
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis é o sistema de verificação de ponta a ponta do OpenClaw para bugs que precisam de um runtime real, um transporte real e prova visível. Ele executa um cenário contra uma ref sabidamente ruim, captura evidências, executa o mesmo cenário contra uma ref candidata e publica a comparação como artefatos que um mantenedor pode inspecionar a partir de um PR ou de um comando local.

Mantis começa com Discord porque Discord nos dá uma primeira lane de alto valor: autenticação real de bot, canais reais de guild, reações, threads, comandos nativos e uma UI de navegador em que humanos podem confirmar visualmente o que o transporte mostrou.

## Objetivos

- Reproduzir um bug de uma issue ou PR do GitHub com o mesmo formato de transporte que os usuários veem.
- Capturar um artefato **antes** na ref de baseline antes de aplicar a correção.
- Capturar um artefato **depois** na ref candidata depois de aplicar a correção.
- Usar um oráculo determinístico sempre que possível, como uma leitura de reação via REST do Discord ou uma verificação de transcrição de canal.
- Capturar screenshots quando o bug tiver uma superfície de UI visível.
- Executar localmente a partir de uma CLI controlada por agente e remotamente a partir do GitHub.
- Preservar estado de máquina suficiente para resgate por VNC quando login, automação de navegador ou autenticação de provedor travar.
- Publicar status conciso em um canal de operador no Discord quando a execução estiver bloqueada, precisar de ajuda manual via VNC ou terminar.

## Fora de escopo

- Mantis não é um substituto para testes unitários. Uma execução do Mantis normalmente deve virar um teste de regressão menor depois que a correção for compreendida.
- Mantis não é o gate rápido normal de CI. Ele é mais lento, usa credenciais live e é reservado para bugs em que o ambiente live importa.
- Mantis não deve exigir um humano para operação normal. VNC manual é um caminho de resgate, não o caminho feliz.
- Mantis não armazena segredos brutos em artefatos, logs, screenshots, relatórios Markdown ou comentários de PR.

## Propriedade

Mantis vive na stack de QA do OpenClaw.

- OpenClaw é proprietário do runtime de cenário, adaptadores de transporte, schema de evidências e CLI local em `pnpm openclaw qa mantis`.
- QA Lab é proprietário das peças de harness de transporte live, helpers de captura de navegador e gravadores de artefatos.
- Crabbox é proprietário de máquinas Linux aquecidas quando uma VM remota é necessária.
- GitHub Actions é proprietário do ponto de entrada do workflow remoto e da retenção de artefatos.
- ClawSweeper é proprietário do roteamento de comentários do GitHub: analisar comandos de mantenedores, despachar o workflow e publicar o comentário final no PR.
- Agentes OpenClaw conduzem o Mantis por meio do Codex quando um cenário precisa de setup agentic, depuração ou relatório de estado travado.

Esse limite mantém o conhecimento de transporte no OpenClaw, o agendamento de máquinas no Crabbox e a cola de workflow de mantenedor no ClawSweeper.

## Formato do comando

O primeiro comando local verifica o bot do Discord, guild, canal, envio de mensagem, envio de reação e caminho de artefato:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

O runner local de antes e depois aceita este formato:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

O runner cria worktrees destacados de baseline e candidata sob o diretório de saída, instala dependências, cria o build de cada ref, executa o cenário com `--allow-failures` e então grava `baseline/`, `candidate/`, `comparison.json` e `mantis-report.md`. Para o primeiro cenário do Discord, uma verificação bem-sucedida significa que o status da baseline é `fail` e o status da candidata é `pass`.

O segundo probe de antes/depois do Discord mira anexos de thread:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Esse cenário publica uma mensagem pai com o bot driver, cria uma thread real do Discord, chama a ação `message.thread-reply` do OpenClaw com um `filePath` local do repositório e então consulta a thread até encontrar a resposta do SUT e o nome do arquivo anexado. O screenshot da baseline mostra a resposta sem anexo; o screenshot da candidata mostra o anexo esperado `mantis-thread-report.md`.

O primeiro primitivo de VM/navegador é o smoke de desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Ele aluga ou reutiliza uma máquina desktop do Crabbox, inicia um navegador visível dentro da sessão VNC, captura o desktop, traz os artefatos de volta para o diretório de saída local e grava o comando de reconexão no relatório. O comando usa por padrão o provedor Hetzner porque ele é o primeiro provedor com cobertura funcional de desktop/VNC na lane do Mantis. Sobrescreva com `--provider`, `--crabbox-bin` ou `OPENCLAW_MANTIS_CRABBOX_PROVIDER` ao executar contra outra frota do Crabbox.

Flags úteis do smoke de desktop:

- `--lease-id <cbx_...>` ou `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` reutiliza um desktop aquecido.
- `--browser-url <url>` altera a página aberta no navegador visível.
- `--html-file <path>` renderiza um artefato HTML local do repositório no navegador visível. Mantis usa isso para capturar a timeline gerada de reações de status do Discord por meio de um desktop real do Crabbox.
- `--browser-profile-dir <remote-path>` reutiliza um user-data-dir remoto do Chrome para que um desktop persistente do Mantis possa permanecer logado entre execuções. Use isso para o perfil de visualizador de longa duração do Discord Web.
- `--browser-profile-archive-env <name>` restaura um archive `.tgz` base64 de user-data-dir do Chrome a partir da variável de ambiente nomeada antes de iniciar o navegador. Use isso para testemunhas logadas, como Discord Web. A env var padrão é `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` controla a duração da captura MP4. Use uma duração maior para apps web logados lentos que precisam de tempo para estabilizar.
- `--keep-lease` ou `OPENCLAW_MANTIS_KEEP_VM=1` mantém um lease recém-criado e aprovado aberto para inspeção por VNC. Execuções com falha mantêm o lease por padrão quando um foi criado, para que um operador possa reconectar.
- `--class`, `--idle-timeout` e `--ttl` ajustam o tamanho da máquina e o tempo de vida do lease.

Para evidências do Discord Web, Mantis usa uma conta dedicada de visualizador em vez de um token de bot. O cenário live da API do Discord continua sendo o oráculo: ele cria a thread real, envia o `thread-reply` do SUT e verifica o anexo por meio do REST do Discord. Quando `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` está definido, o cenário também grava um artefato de URL do Discord Web. Quando `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` está definido, ele deixa essa thread disponível por tempo suficiente para um navegador logado abri-la e gravá-la.

O workflow do GitHub abre a URL da thread candidata no Discord Web, captura um screenshot, grava um MP4 e gera uma prévia em GIF recortada por movimento quando as ferramentas de mídia do Crabbox estão disponíveis. Prefira um caminho de perfil persistente de visualizador configurado por meio de `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, porque archives completos de perfil do Chrome podem exceder o limite de tamanho de segredo do GitHub. Para perfis pequenos/de bootstrap, o workflow também pode restaurar um archive `.tgz` base64 de `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Se nenhuma fonte de perfil estiver configurada, o workflow ainda publica os screenshots determinísticos de anexos da baseline/candidata e registra um aviso de que a testemunha logada do Discord Web foi ignorada.

O primeiro primitivo completo de transporte de desktop é o smoke de desktop do Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ele aluga ou reutiliza uma máquina desktop do Crabbox, sincroniza o checkout atual para dentro da VM, executa `pnpm openclaw qa slack` dentro dessa VM, abre o Slack Web no navegador VNC, captura o desktop visível e copia tanto os artefatos de QA do Slack quanto o screenshot de VNC de volta para o diretório de saída local. Este é o primeiro formato do Mantis em que o Gateway do OpenClaw do SUT e o navegador vivem ambos dentro da mesma VM Linux desktop.

Com `--gateway-setup`, o comando prepara um home persistente e descartável do OpenClaw em `$HOME/.openclaw-mantis/slack-openclaw`, aplica patches à configuração de Slack Socket Mode para o canal selecionado, inicia `openclaw gateway run` na porta `38973` e mantém o Chrome em execução na sessão VNC. Este é o modo "deixe-me um desktop Linux com Slack e uma claw rodando"; a lane de QA do Slack bot a bot continua sendo o padrão quando `--gateway-setup` é omitido.

Entradas obrigatórias para `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` para a lane de modelo remoto. Se apenas `OPENAI_API_KEY` estiver definida localmente, Mantis a mapeia para `OPENCLAW_LIVE_OPENAI_KEY` antes de invocar o Crabbox para que o encaminhamento de env `OPENCLAW_*` do Crabbox possa carregá-la para dentro da VM.

Com `--gateway-setup --credential-source convex`, Mantis aluga a credencial SUT do Slack a partir do pool compartilhado antes de criar a VM e encaminha o id do canal alugado, o token de app Socket Mode e o token de bot como env de runtime `OPENCLAW_MANTIS_SLACK_*` dentro do desktop. Isso mantém os workflows do GitHub enxutos: eles só precisam do segredo do broker Convex, não de tokens brutos de bot ou app do Slack.

Flags úteis do desktop Slack:

- `--lease-id <cbx_...>` reexecuta contra uma máquina em que um operador já fez login no Slack Web via VNC.
- `--gateway-setup` inicia um Gateway Slack persistente do OpenClaw na VM em vez de apenas executar a lane de QA bot a bot.
- `--keep-lease` mantém a VM do Gateway aberta para inspeção por VNC após sucesso; `--no-keep-lease` a interrompe depois de coletar artefatos.
- `--slack-url <url>` abre uma URL específica do Slack Web. Sem ela, Mantis deriva `https://app.slack.com/client/<team>/<channel>` de Slack `auth.test` quando o token de bot do SUT está disponível.
- `--slack-channel-id <id>` controla a allowlist de canais do Slack usada pelo setup do Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controla o perfil persistente do Chrome dentro da VM. O padrão é `$HOME/.config/openclaw-mantis/slack-chrome-profile`, para que um login manual no Slack Web sobreviva a reexecuções no mesmo lease.
- `--credential-source convex --credential-role ci` usa o pool compartilhado de credenciais em vez de tokens Slack diretos por env.
- `--provider-mode`, `--model`, `--alt-model` e `--fast` são repassados para a lane live do Slack.

O workflow smoke do GitHub é `Mantis Discord Smoke`. O workflow de antes e depois do GitHub para o primeiro cenário real é `Mantis Discord Status Reactions`. Ele aceita:

- `baseline_ref`: a ref esperada para reproduzir o comportamento somente enfileirado.
- `candidate_ref`: a ref esperada para mostrar `queued -> thinking -> done`.

Ele faz checkout da ref do harness do workflow, cria builds de worktrees separadas de baseline e candidata, executa `discord-status-reactions-tool-only` contra cada worktree e faz upload de `baseline/`, `candidate/`, `comparison.json` e `mantis-report.md` como artefatos do Actions. Ele também renderiza o HTML de timeline de cada lane em um navegador desktop do Crabbox e publica esses screenshots de VNC ao lado dos PNGs determinísticos de timeline no comentário do PR. O mesmo comentário de PR incorpora prévias leves em GIF recortadas por movimento geradas por `crabbox media preview`, links para os clipes MP4 correspondentes recortados por movimento e mantém os arquivos MP4 completos de desktop para inspeção profunda. Screenshots permanecem inline para revisão rápida. O workflow cria o build da CLI do Crabbox a partir de `openclaw/crabbox` main para poder usar as flags atuais de lease de desktop/navegador antes que a próxima versão binária do Crabbox seja lançada.

`Mantis Scenario` é o ponto de entrada manual genérico. Ele recebe um `scenario_id`, `candidate_ref`, `baseline_ref` opcional e `pr_number` opcional e então despacha o workflow pertencente ao cenário. O wrapper é intencionalmente fino: workflows de cenário ainda são proprietários de seu setup de transporte, credenciais, classe de VM, oráculo esperado e manifesto de artefatos.

`Mantis Slack Desktop Smoke` é o primeiro workflow de VM do Slack. Ele faz checkout da ref candidata confiável em uma worktree separada, aluga um desktop Linux no Crabbox, executa `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` contra essa candidata, abre o Slack Web no navegador VNC, grava o desktop, gera uma prévia recortada por movimento com `crabbox media preview`, faz upload do diretório completo de artefatos e, opcionalmente, publica o comentário de evidência em linha no PR de destino. Ele usa AWS por padrão para o aluguel do desktop e expõe uma entrada manual de provedor para que operadores possam trocar para Hetzner quando a capacidade da AWS estiver lenta ou indisponível. Use esta lane quando quiser "um desktop Linux com Slack e uma claw em execução" em vez de apenas uma transcrição Slack de bot para bot.

`Mantis Telegram Live` envolve a lane de QA live existente do Telegram no mesmo pipeline de evidências de PR. Ele faz checkout da ref candidata confiável em uma worktree separada, executa `pnpm openclaw qa telegram --credential-source convex --credential-role ci`, escreve um manifesto `mantis-evidence.json` a partir do resumo de QA do Telegram e do artefato de mensagem observada, renderiza o HTML da transcrição redigida por meio de um navegador desktop do Crabbox, gera um GIF recortado por movimento com `crabbox media preview` e publica o comentário de evidência em linha do PR quando um número de PR está disponível. Esta lane é visual de transcrição, não uma prova do Telegram Web com login: a API de Bot do Telegram fornece evidências estáveis de mensagens live, mas o estado de login do Telegram Web não é necessário para a automação normal do Mantis.

`Mantis Telegram Desktop Proof` é o wrapper agêntico nativo do Telegram Desktop antes/depois. Um mantenedor pode acioná-lo a partir de um comentário de PR com `@Mantis telegram desktop proof`, pela interface do Actions com instruções livres, ou pelo dispatcher genérico `Mantis Scenario`. O workflow entrega o PR, a ref de baseline, a ref candidata e as instruções do mantenedor ao Codex. O agente lê o PR, decide qual comportamento visível no Telegram prova a mudança, executa a lane de prova do Telegram Desktop com usuário real no Crabbox para baseline e candidata, itera até que os GIFs nativos sejam úteis, grava artefatos `motionPreview` pareados em `mantis-evidence.json`, faz upload do pacote e publica uma tabela de evidências de PR com 2 colunas quando um número de PR está disponível.

Para configuração do Telegram desktop com humano no loop, use o construtor de cenários:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

O construtor aluga ou reutiliza um desktop Crabbox, instala o binário nativo Linux do Telegram Desktop, opcionalmente restaura um arquivo de sessão de usuário, configura o OpenClaw com o token de bot SUT do Telegram alugado, inicia `openclaw gateway run` na porta `38974`, publica uma mensagem de prontidão do bot driver no grupo privado alugado e então captura uma captura de tela e um MP4 do desktop VNC visível. Um token de bot nunca faz login no Telegram Desktop; ele apenas configura o OpenClaw. O visualizador do desktop é uma sessão separada de usuário do Telegram restaurada a partir de `--telegram-profile-archive-env <name>` ou criada manualmente pelo VNC e mantida ativa com `--keep-lease`.

Flags úteis do construtor de Telegram desktop:

- `--lease-id <cbx_...>` executa novamente contra uma VM em que um operador já fez login no Telegram Desktop.
- `--telegram-profile-archive-env <name>` lê um arquivo de perfil do Telegram Desktop `.tgz` em base64 dessa variável de ambiente e o restaura antes do lançamento.
- `--telegram-profile-dir <remote-path>` controla o diretório remoto de perfil do Telegram Desktop. O padrão é `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` instala e abre o Telegram Desktop sem configurar o OpenClaw.
- `--credential-source convex --credential-role ci` usa o broker de credenciais compartilhado em vez de tokens diretos de env do Telegram.

Todo cenário que publica em PR grava `mantis-evidence.json` ao lado de seu relatório. Este schema é a transferência entre o código do cenário e os comentários do GitHub:

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

Os valores de `path` dos artefatos são relativos ao diretório do manifesto. Os valores de `targetPath` são caminhos relativos sob o diretório de publicação de destino da branch `qa-artifacts`. O publicador rejeita travessia de caminhos e ignora entradas marcadas como `"required": false` quando prévias ou vídeos opcionais não estão disponíveis.

Tipos de artefato compatíveis:

- `timeline`: captura de tela determinística do cenário, geralmente antes/depois.
- `desktopScreenshot`: captura de tela do desktop VNC/navegador.
- `motionPreview`: GIF animado em linha gerado a partir da gravação do desktop.
- `motionClip`: MP4 recortado por movimento que remove a entrada e a cauda estáticas.
- `fullVideo`: gravação MP4 completa para inspeção profunda.
- `metadata`: auxiliar JSON/log.
- `report`: relatório em Markdown.

O publicador reutilizável é `scripts/mantis/publish-pr-evidence.mjs`. Workflows o chamam com o manifesto, PR de destino, raiz de destino `qa-artifacts`, marcador de comentário, URL do artefato do Actions, URL da execução e origem da solicitação. Ele copia os artefatos declarados para a branch `qa-artifacts`, cria um comentário de PR com resumo primeiro, imagens/prévias em linha e vídeos vinculados, e então atualiza o comentário de marcador existente ou cria um.

Você também pode acionar a execução de status-reactions diretamente a partir de um comentário de PR:

```text
@Mantis discord status reactions
```

O gatilho de comentário é intencionalmente estreito. Ele só executa em comentários de pull request de usuários com acesso de gravação, manutenção ou administrador, e só reconhece solicitações de reações de status do Discord. Por padrão, ele usa a ref de baseline ruim conhecida e o SHA do head do PR atual como candidata. Mantenedores podem substituir qualquer uma das refs:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

O QA live do Telegram também pode ser acionado a partir de um comentário de PR:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Por padrão, ele usa o SHA do head do PR atual como candidata e executa `telegram-status-command`. Mantenedores podem substituir `candidate=...`, `provider=aws|hetzner` e `lease=<cbx_...>` quando precisarem de uma ref específica ou de um desktop Crabbox pré-aquecido.

Exemplos de comandos do ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

O primeiro comando é explícito e focado no cenário. O segundo pode posteriormente mapear um PR ou issue para cenários Mantis recomendados a partir de labels, arquivos alterados e achados de revisão do ClawSweeper.

## Ciclo de vida da execução

1. Adquirir credenciais.
2. Alocar ou reutilizar uma VM.
3. Preparar o perfil de desktop/navegador quando o cenário precisar de evidência de UI.
4. Preparar um checkout limpo para a ref de baseline.
5. Instalar dependências e compilar apenas o que o cenário precisa.
6. Iniciar um Gateway OpenClaw filho com um diretório de estado isolado.
7. Configurar o transporte live, provedor, modelo e perfil do navegador.
8. Executar o cenário e capturar evidências de baseline.
9. Parar o Gateway e preservar logs.
10. Preparar a ref candidata na mesma VM.
11. Executar o mesmo cenário e capturar evidências da candidata.
12. Comparar os resultados do oráculo e a evidência visual.
13. Gravar Markdown, JSON, logs, capturas de tela e artefatos de trace opcionais.
14. Fazer upload de artefatos do GitHub Actions.
15. Publicar uma mensagem concisa de status no PR ou Discord.

O cenário deve poder falhar de duas formas diferentes:

- **Bug reproduzido**: a baseline falhou da maneira esperada.
- **Falha do harness**: configuração do ambiente, credenciais, API do Discord, navegador ou provedor falhou antes que o oráculo do bug fosse significativo.

O relatório final deve separar esses casos para que mantenedores não confundam um ambiente instável com comportamento do produto.

## MVP do Discord

O primeiro cenário deve mirar reações de status do Discord em canais de guilda onde o modo de entrega da resposta de origem é `message_tool_only`.

Por que ele é uma boa semente do Mantis:

- É visível no Discord como reações na mensagem de disparo.
- Tem um oráculo REST forte pelo estado de reações da mensagem do Discord.
- Exercita um Gateway OpenClaw real, autenticação de bot do Discord, despacho de mensagens, modo de entrega de resposta de origem, estado de reação de status e ciclo de vida de turno do modelo.
- É estreito o suficiente para manter a primeira implementação honesta.

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

A evidência de baseline deve mostrar a reação de confirmação enfileirada, mas nenhuma transição de ciclo de vida no modo somente ferramenta. A evidência da candidata deve mostrar reações de status de ciclo de vida em execução quando `messages.statusReactions.enabled` estiver explicitamente true.

A primeira fatia executável é o cenário de QA live opt-in do Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Ele configura o SUT com manipulação de guilda sempre ativa, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` e reações de status explícitas. O oráculo consulta a mensagem real de disparo do Discord e espera a sequência observada `👀 -> 🤔 -> 👍`. Os artefatos incluem `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html` e `discord-status-reactions-tool-only-timeline.png`.

## Componentes de QA existentes

O Mantis deve se apoiar na pilha privada de QA existente em vez de começar do zero:

- `pnpm openclaw qa discord` já executa uma lane live do Discord com bots driver e SUT.
- O executor de transporte live já grava relatórios e artefatos de mensagem observada em `.artifacts/qa-e2e/`.
- Aluguéis de credenciais Convex já fornecem acesso exclusivo a credenciais compartilhadas de transporte live.
- O serviço de controle de navegador já oferece suporte a capturas de tela, snapshots, perfis gerenciados headless e perfis CDP remotos.
- O QA Lab já tem uma UI de depurador e bus para testes com formato de transporte.

A primeira implementação do Mantis pode ser um executor fino de antes/depois sobre esses componentes, mais uma camada de evidência visual.

## Modelo de evidências

Cada execução grava um diretório estável de artefatos:

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

`mantis-summary.json` deve ser a fonte da verdade legível por máquina. O relatório Markdown é para comentários de PR e revisão humana.

O resumo deve incluir:

- refs e SHAs testados
- transporte e id do cenário
- provedor da máquina e id da máquina ou id do aluguel
- origem das credenciais sem valores secretos
- resultado da baseline
- resultado da candidata
- se o bug foi reproduzido na baseline
- se a candidata o corrigiu
- caminhos dos artefatos
- problemas de configuração ou limpeza sanitizados

Capturas de tela são evidências, não segredos. Ainda assim, precisam de disciplina de redação:
nomes de canais privados, nomes de usuários ou conteúdo de mensagens podem aparecer. Para PRs públicos,
prefira links de artefatos do GitHub Actions a imagens inline até que a história de redação
esteja mais forte.

## Navegador e VNC

A faixa do navegador tem dois modos:

- **Automação headless**: padrão para CI. O Chrome executa com CDP habilitado, e
  o Playwright ou o controle de navegador do OpenClaw captura capturas de tela.
- **Resgate por VNC**: habilitado na mesma VM quando login, MFA, antiautomação do Discord
  ou depuração visual precisam de uma pessoa.

O perfil do navegador observador do Discord deve ser persistente o suficiente para evitar
login em toda execução, mas isolado do estado do navegador pessoal. Um perfil
pertence ao pool de máquinas Mantis, não ao laptop de um desenvolvedor.

Quando o Mantis fica travado, ele publica uma mensagem de status no Discord com:

- id da execução
- id do cenário
- provedor da máquina
- diretório de artefatos
- instruções de conexão VNC ou noVNC, se disponíveis
- texto curto do bloqueador

A primeira implantação privada pode publicar essas mensagens no canal de operador
existente e migrar para um canal dedicado do Mantis mais tarde.

## Máquinas

O Mantis deve preferir AWS por meio do Crabbox para a primeira implementação remota.
O Crabbox nos dá máquinas aquecidas, rastreamento de concessões, hidratação, logs, resultados e
limpeza. Se a capacidade da AWS for lenta demais ou indisponível, adicione um provedor Hetzner
por trás da mesma interface de máquina.

Requisitos mínimos da VM:

- Linux com uma instalação de Chrome ou Chromium capaz de desktop
- acesso CDP para automação do navegador
- VNC ou noVNC para resgate
- Node 22 e pnpm
- checkout do OpenClaw e cache de dependências
- cache do navegador Chromium do Playwright quando o Playwright é usado
- CPU e memória suficientes para um Gateway do OpenClaw, um navegador e uma execução de modelo
- acesso de saída ao Discord, GitHub, provedores de modelo e ao broker de credenciais

A VM não deve manter segredos brutos de longa duração fora dos armazenamentos esperados de credenciais ou
perfis de navegador.

## Segredos

Segredos ficam em segredos da organização ou do repositório do GitHub para execuções remotas, e em
um arquivo de segredos local controlado pelo operador para execuções locais.

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

No longo prazo, o pool de credenciais Convex deve continuar sendo a fonte normal de credenciais de transporte
ao vivo. Segredos do GitHub inicializam o broker e as faixas de fallback.
O fluxo de trabalho de reações de status do Discord mapeia os segredos Mantis Crabbox de volta para
as variáveis de ambiente `CRABBOX_COORDINATOR` e `CRABBOX_COORDINATOR_TOKEN`
que a CLI do Crabbox espera. Os nomes simples de segredos do GitHub `CRABBOX_*` continuam
aceitos como fallback de compatibilidade.

O executor do Mantis nunca deve imprimir:

- tokens de bots do Discord
- chaves de API de provedores
- cookies de navegador
- conteúdo de perfis de autenticação
- senhas de VNC
- cargas brutas de credenciais

Uploads públicos de artefatos também devem redigir metadados de destino do Discord, como ids de bot,
guilda, canal e mensagem. O fluxo de trabalho de smoke do GitHub habilita
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` por esse motivo.

Se um token for colado acidentalmente em uma issue, PR, chat ou log, faça a rotação dele
depois que o novo segredo tiver sido armazenado.

## Artefatos do GitHub e comentários de PR

Os fluxos de trabalho do Mantis devem fazer upload do pacote completo de evidências como um artefato de curta duração do Actions.
Quando o fluxo de trabalho for executado para um relatório de bug ou PR de correção, ele também deve
publicar as capturas de tela PNG redigidas no branch `qa-artifacts` e fazer upsert de um
comentário nesse bug ou PR de correção com capturas de tela inline de antes/depois. Não publique
a prova principal apenas em um PR genérico de automação de QA. Logs brutos, mensagens observadas
e outras evidências volumosas ficam no artefato do Actions.

Fluxos de trabalho de produção devem publicar esses comentários com o GitHub App do Mantis, não
com `github-actions[bot]`. Armazene o id do app e a chave privada como segredos do GitHub Actions
`MANTIS_GITHUB_APP_ID` e `MANTIS_GITHUB_APP_PRIVATE_KEY`.
O fluxo de trabalho usa um marcador oculto como chave de upsert, atualiza esse
comentário quando o token consegue editá-lo, e cria um novo comentário de propriedade do Mantis quando
um marcador antigo de propriedade de bot não pode ser editado.

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

Quando a execução falha porque o harness falhou, o comentário deve dizer isso em vez
de sugerir que o candidato falhou.

## Notas de implantação privada

Uma implantação privada talvez já tenha um aplicativo Discord do Mantis. Reutilize esse
aplicativo em vez de criar outro app quando ele tiver as permissões corretas de bot
e puder ser rotacionado com segurança.

Defina o canal inicial de notificação do operador por meio de segredos ou da configuração de implantação.
Ele pode apontar primeiro para um canal existente de mantenedores ou operações,
depois migrar para um canal dedicado do Mantis assim que existir.

Não coloque ids de guilda, ids de canal, tokens de bot, cookies de navegador ou senhas de VNC
neste documento. Armazene-os nos segredos do GitHub, no broker de credenciais ou no
armazenamento local de segredos do operador.

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
- orçamento de timeout
- etapas de limpeza

Cenários devem preferir oráculos pequenos e tipados:

- estado de reação do Discord para bugs de reação
- referências de mensagens do Discord para bugs de encadeamento
- ts de thread do Slack e estado da API de reações para bugs do Slack
- ids e cabeçalhos de mensagens de email para bugs de email
- capturas de tela do navegador quando a UI é o único observável confiável

Verificações visuais devem ser aditivas. Se uma API da plataforma puder provar o bug, use a
API como oráculo de aprovação/falha e mantenha as capturas de tela para confiança humana.

## Expansão de provedores

Depois do Discord, o mesmo executor pode adicionar:

- Slack: reações, threads, menções ao app, modais, uploads de arquivos.
- Email: autenticação do Gmail e encadeamento de mensagens usando `gog` onde conectores não são
  suficientes.
- WhatsApp: login por QR, reidentificação, entrega de mensagens, mídia, reações.
- Telegram: bloqueio por menção em grupo, comandos, reações quando disponíveis.
- Matrix: salas criptografadas, relações de thread ou resposta, retomada após reinício.

Cada transporte deve ter um cenário de smoke barato e um ou mais cenários de classe de bug.
Cenários visuais caros devem permanecer opt-in.

## Questões em aberto

- Qual bot do Discord deve ser o driver, e qual deve ser o SUT, quando o
  bot Mantis existente for reutilizado?
- O login do navegador observador deve usar uma conta humana do Discord, uma conta de teste
  ou apenas evidência REST legível por bot na primeira fase?
- Por quanto tempo o GitHub deve reter artefatos do Mantis para PRs?
- Quando o ClawSweeper deve recomendar automaticamente o Mantis em vez de esperar por um
  comando de mantenedor?
- As capturas de tela devem ser redigidas ou cortadas antes do upload para PRs públicos?
