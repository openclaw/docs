---
read_when:
    - Criar ou executar garantia de qualidade visual ao vivo para erros do OpenClaw
    - Adicionar verificação antes e depois para uma solicitação de pull
    - Como adicionar cenários de transporte em tempo real do Discord, Slack, WhatsApp ou outros
    - Depuração de execuções de QA que precisam de capturas de tela, automação de navegador ou acesso VNC
summary: Mantis é o sistema visual de verificação de ponta a ponta para reproduzir bugs do OpenClaw em transportes ao vivo, capturar evidências de antes e depois e anexar artefatos a PRs.
title: Louva-a-deus
x-i18n:
    generated_at: "2026-05-04T05:52:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d3f3fa3db111b1b5c85f8efeccd749fbd5885cee6b7843ca4c8d049acfd9164
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis é o sistema de verificação ponta a ponta do OpenClaw para bugs que precisam de um runtime real, um transporte real e prova visível. Ele executa um cenário contra uma ref sabidamente ruim, captura evidências, executa o mesmo cenário contra uma ref candidata e publica a comparação como artefatos que um mantenedor pode inspecionar a partir de um PR ou de um comando local.

Mantis começa com Discord porque Discord nos dá uma primeira faixa de alto valor: autenticação real de bot, canais reais de guilda, reações, threads, comandos nativos e uma interface de navegador onde humanos podem confirmar visualmente o que o transporte mostrou.

## Objetivos

- Reproduzir um bug de uma issue ou PR do GitHub com o mesmo formato de transporte que os usuários veem.
- Capturar um artefato **antes** na ref de linha de base antes de aplicar a correção.
- Capturar um artefato **depois** na ref candidata depois de aplicar a correção.
- Usar um oráculo determinístico sempre que possível, como uma leitura de reação via REST do Discord ou uma verificação de transcrição do canal.
- Capturar screenshots quando o bug tiver uma superfície de UI visível.
- Executar localmente a partir de uma CLI controlada por agente e remotamente a partir do GitHub.
- Preservar estado de máquina suficiente para resgate via VNC quando login, automação de navegador ou autenticação de provedor travar.
- Postar status conciso em um canal Discord de operador quando a execução estiver bloqueada, precisar de ajuda manual via VNC ou terminar.

## Fora do escopo

- Mantis não substitui testes unitários. Uma execução do Mantis normalmente deve virar um teste de regressão menor depois que a correção for entendida.
- Mantis não é o gate rápido normal de CI. Ele é mais lento, usa credenciais ao vivo e é reservado para bugs em que o ambiente ao vivo importa.
- Mantis não deve exigir um humano para operação normal. VNC manual é um caminho de resgate, não o caminho ideal.
- Mantis não armazena segredos brutos em artefatos, logs, screenshots, relatórios Markdown ou comentários de PR.

## Propriedade

Mantis vive na pilha de QA do OpenClaw.

- OpenClaw é dono do runtime de cenários, adaptadores de transporte, esquema de evidências e CLI local sob `pnpm openclaw qa mantis`.
- QA Lab é dono das partes do harness de transporte ao vivo, helpers de captura de navegador e gravadores de artefatos.
- Crabbox é dono das máquinas Linux aquecidas quando uma VM remota é necessária.
- GitHub Actions é dono do ponto de entrada do workflow remoto e da retenção de artefatos.
- ClawSweeper é dono do roteamento de comentários do GitHub: análise de comandos de mantenedor, disparo do workflow e postagem do comentário final no PR.
- Agentes OpenClaw conduzem Mantis por meio do Codex quando um cenário precisa de configuração agêntica, depuração ou relatório de estado travado.

Esse limite mantém o conhecimento de transporte no OpenClaw, o agendamento de máquinas no Crabbox e a cola do workflow de mantenedores no ClawSweeper.

## Formato dos comandos

O primeiro comando local verifica o bot do Discord, guilda, canal, envio de mensagem, envio de reação e caminho de artefatos:

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

O executor cria worktrees destacados de linha de base e candidata sob o diretório de saída, instala dependências, compila cada ref, executa o cenário com `--allow-failures` e então grava `baseline/`, `candidate/`, `comparison.json` e `mantis-report.md`. Para o primeiro cenário de Discord, uma verificação bem-sucedida significa que o status da linha de base é `fail` e o status da candidata é `pass`.

A primeira primitiva de VM/navegador é o smoke de desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Ele aluga ou reutiliza uma máquina desktop Crabbox, inicia um navegador visível dentro da sessão VNC, captura o desktop, traz os artefatos de volta para o diretório de saída local e grava o comando de reconexão no relatório. O comando usa por padrão o provedor Hetzner porque ele é o primeiro provedor com cobertura desktop/VNC funcionando na faixa do Mantis. Substitua-o com `--provider`, `--crabbox-bin` ou `OPENCLAW_MANTIS_CRABBOX_PROVIDER` ao executar contra outra frota Crabbox.

Flags úteis do smoke de desktop:

- `--lease-id <cbx_...>` ou `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` reutiliza um desktop aquecido.
- `--browser-url <url>` altera a página aberta no navegador visível.
- `--html-file <path>` renderiza um artefato HTML local do repo no navegador visível. Mantis usa isso para capturar a linha do tempo gerada de reações de status do Discord por meio de um desktop Crabbox real.
- `--keep-lease` ou `OPENCLAW_MANTIS_KEEP_VM=1` mantém aberto um lease recém-criado e aprovado para inspeção via VNC. Execuções com falha mantêm o lease por padrão quando um foi criado para que um operador possa se reconectar.
- `--class`, `--idle-timeout` e `--ttl` ajustam o tamanho da máquina e o tempo de vida do lease.

A primeira primitiva completa de transporte desktop é o smoke de desktop do Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ele aluga ou reutiliza uma máquina desktop Crabbox, sincroniza o checkout atual para a VM, executa `pnpm openclaw qa slack` dentro dessa VM, abre Slack Web no navegador VNC, captura o desktop visível e copia tanto os artefatos de QA do Slack quanto a screenshot do VNC de volta para o diretório de saída local. Este é o primeiro formato do Mantis em que o Gateway OpenClaw SUT e o navegador vivem ambos dentro da mesma VM desktop Linux.

Com `--gateway-setup`, o comando prepara uma home OpenClaw descartável persistente em `$HOME/.openclaw-mantis/slack-openclaw`, ajusta a configuração do Slack Socket Mode para o canal selecionado, inicia `openclaw gateway run` na porta `38973` e mantém o Chrome em execução na sessão VNC. Este é o modo "deixe-me um desktop Linux com Slack e um claw em execução"; a faixa de QA Slack bot-para-bot permanece o padrão quando `--gateway-setup` é omitido.

Entradas obrigatórias para `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` para a faixa de modelo remota. Se apenas `OPENAI_API_KEY` estiver definido localmente, Mantis o mapeia para `OPENCLAW_LIVE_OPENAI_KEY` antes de invocar o Crabbox para que o encaminhamento de env `OPENCLAW_*` do Crabbox possa levá-lo para dentro da VM.

Flags úteis de desktop do Slack:

- `--lease-id <cbx_...>` reexecuta contra uma máquina em que um operador já fez login no Slack Web por VNC.
- `--gateway-setup` inicia um Gateway Slack OpenClaw persistente na VM em vez de apenas executar a faixa de QA bot-para-bot.
- `--slack-url <url>` abre uma URL específica do Slack Web. Sem isso, Mantis deriva `https://app.slack.com/client/<team>/<channel>` a partir de `auth.test` do Slack quando o token do bot SUT está disponível.
- `--slack-channel-id <id>` controla a allowlist de canais Slack usada pela configuração do Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controla o perfil persistente do Chrome dentro da VM. O padrão é `$HOME/.config/openclaw-mantis/slack-chrome-profile`, então um login manual no Slack Web sobrevive a reexecuções no mesmo lease.
- `--credential-source convex --credential-role ci` usa o pool de credenciais compartilhado em vez de tokens Slack diretos via env.
- `--provider-mode`, `--model`, `--alt-model` e `--fast` são repassados para a faixa ao vivo do Slack.

O workflow smoke do GitHub é `Mantis Discord Smoke`. O workflow GitHub de antes e depois para o primeiro cenário real é `Mantis Discord Status Reactions`. Ele aceita:

- `baseline_ref`: a ref esperada para reproduzir comportamento apenas enfileirado.
- `candidate_ref`: a ref esperada para mostrar `queued -> thinking -> done`.

Ele faz checkout da ref do harness do workflow, compila worktrees separados de linha de base e candidata, executa `discord-status-reactions-tool-only` contra cada worktree e faz upload de `baseline/`, `candidate/`, `comparison.json` e `mantis-report.md` como artefatos do Actions. Ele também renderiza o HTML da linha do tempo de cada faixa em um navegador desktop Crabbox e publica essas screenshots VNC ao lado dos PNGs determinísticos da linha do tempo no comentário do PR. O workflow compila a CLI do Crabbox a partir de `openclaw/crabbox` main para poder usar as flags atuais de lease desktop/navegador antes do próximo release binário do Crabbox ser cortado.

Você também pode disparar a execução de reações de status diretamente a partir de um comentário no PR:

```text
@Mantis discord status reactions
```

O gatilho por comentário é intencionalmente estreito. Ele só executa em comentários de pull request de usuários com acesso write, maintain ou admin, e só reconhece solicitações de reação de status do Discord. Por padrão, ele usa a ref de linha de base sabidamente ruim e o SHA atual do head do PR como candidata. Mantenedores podem substituir qualquer uma das refs:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Exemplos de comandos do ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

O primeiro comando é explícito e focado em cenário. O segundo pode, futuramente, mapear um PR ou issue para cenários Mantis recomendados a partir de labels, arquivos alterados e achados de revisão do ClawSweeper.

## Ciclo de vida da execução

1. Adquirir credenciais.
2. Alocar ou reutilizar uma VM.
3. Preparar o perfil de desktop/navegador quando o cenário precisar de evidência de UI.
4. Preparar um checkout limpo para a ref de linha de base.
5. Instalar dependências e compilar apenas o que o cenário precisa.
6. Iniciar um Gateway OpenClaw filho com um diretório de estado isolado.
7. Configurar o transporte ao vivo, provedor, modelo e perfil de navegador.
8. Executar o cenário e capturar evidência da linha de base.
9. Parar o Gateway e preservar logs.
10. Preparar a ref candidata na mesma VM.
11. Executar o mesmo cenário e capturar evidência da candidata.
12. Comparar os resultados do oráculo e a evidência visual.
13. Gravar Markdown, JSON, logs, screenshots e artefatos opcionais de trace.
14. Fazer upload de artefatos do GitHub Actions.
15. Postar uma mensagem concisa de status no PR ou Discord.

O cenário deve ser capaz de falhar de duas formas diferentes:

- **Bug reproduzido**: a linha de base falhou da forma esperada.
- **Falha do harness**: configuração de ambiente, credenciais, API do Discord, navegador ou provedor falhou antes que o oráculo do bug fosse significativo.

O relatório final deve separar esses casos para que mantenedores não confundam um ambiente instável com comportamento do produto.

## MVP do Discord

O primeiro cenário deve mirar reações de status do Discord em canais de guilda onde o modo de entrega de resposta da origem é `message_tool_only`.

Por que ele é uma boa semente para o Mantis:

- Ele é visível no Discord como reações na mensagem acionadora.
- Ele tem um oráculo REST forte por meio do estado de reações de mensagem do Discord.
- Ele exercita um Gateway OpenClaw real, autenticação de bot Discord, despacho de mensagens, modo de entrega de resposta da origem, estado de reação de status e ciclo de vida de turno do modelo.
- Ele é estreito o suficiente para manter a primeira implementação honesta.

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

A evidência da linha de base deve mostrar a reação de reconhecimento enfileirada, mas nenhuma transição de ciclo de vida no modo apenas ferramentas. A evidência candidata deve mostrar reações de status do ciclo de vida em execução quando `messages.statusReactions.enabled` estiver explicitamente `true`.

O primeiro recorte executável é o cenário de QA ao vivo do Discord com opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Ele configura o SUT com tratamento de guild sempre ativo, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` e reações de status explícitas. O oracle
consulta a mensagem real de acionamento no Discord e espera a sequência observada
`👀 -> 🤔 -> 👍`. Os artefatos incluem `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` e
`discord-status-reactions-tool-only-timeline.png`.

## Peças de QA Existentes

O Mantis deve se basear na pilha privada de QA existente em vez de começar do
zero:

- `pnpm openclaw qa discord` já executa uma faixa live do Discord com bots de driver e
  SUT.
- O runner de transporte live já grava relatórios e artefatos de mensagens
  observadas em `.artifacts/qa-e2e/`.
- Os leases de credenciais do Convex já fornecem acesso exclusivo a credenciais
  compartilhadas de transporte live.
- O serviço de controle do navegador já oferece suporte a capturas de tela, snapshots,
  perfis gerenciados headless e perfis CDP remotos.
- O QA Lab já tem uma UI de depuração e um barramento para testes no formato de transporte.

A primeira implementação do Mantis pode ser um runner fino de antes/depois sobre essas
peças, além de uma camada de evidência visual.

## Modelo de Evidência

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

`mantis-summary.json` deve ser a fonte da verdade legível por máquina. O
relatório em Markdown é para comentários em PRs e revisão humana.

O resumo deve incluir:

- refs e SHAs testados
- transporte e id do cenário
- provedor da máquina e id da máquina ou id do lease
- fonte das credenciais sem valores secretos
- resultado da baseline
- resultado do candidate
- se o bug foi reproduzido na baseline
- se o candidate o corrigiu
- caminhos dos artefatos
- problemas sanitizados de configuração ou limpeza

Capturas de tela são evidências, não segredos. Ainda assim, elas precisam de disciplina
de redação: nomes de canais privados, nomes de usuários ou conteúdo de mensagens podem
aparecer. Para PRs públicos, prefira links de artefatos do GitHub Actions em vez de
imagens inline até que a estratégia de redação esteja mais forte.

## Navegador e VNC

A faixa do navegador tem dois modos:

- **Automação headless**: padrão para CI. O Chrome roda com CDP habilitado, e
  Playwright ou o controle de navegador do OpenClaw captura capturas de tela.
- **Resgate por VNC**: habilitado na mesma VM quando login, MFA, anti-automação do Discord
  ou depuração visual exigem uma pessoa.

O perfil do navegador observador do Discord deve ser persistente o suficiente para evitar
login em toda execução, mas isolado do estado pessoal do navegador. Um perfil
pertence ao pool de máquinas do Mantis, não a um laptop de desenvolvedor.

Quando o Mantis fica travado, ele publica uma mensagem de status no Discord com:

- id da execução
- id do cenário
- provedor da máquina
- diretório de artefatos
- instruções de conexão VNC ou noVNC, se disponíveis
- texto curto do bloqueador

A primeira implantação privada pode publicar essas mensagens no canal de operadores existente
e migrar para um canal dedicado do Mantis depois.

## Máquinas

O Mantis deve preferir AWS por meio do Crabbox para a primeira implementação remota.
O Crabbox nos dá máquinas aquecidas, rastreamento de leases, hidratação, logs, resultados e
limpeza. Se a capacidade da AWS for lenta demais ou estiver indisponível, adicione um provedor
Hetzner por trás da mesma interface de máquina.

Requisitos mínimos da VM:

- Linux com instalação do Chrome ou Chromium capaz de desktop
- acesso CDP para automação do navegador
- VNC ou noVNC para resgate
- Node 22 e pnpm
- checkout do OpenClaw e cache de dependências
- cache do navegador Chromium do Playwright quando Playwright for usado
- CPU e memória suficientes para um OpenClaw Gateway, um navegador e uma execução de modelo
- acesso de saída ao Discord, GitHub, provedores de modelo e ao broker de credenciais

A VM não deve manter segredos brutos de longa duração fora dos armazenamentos esperados de credenciais ou
perfil do navegador.

## Segredos

Segredos ficam em segredos da organização ou do repositório no GitHub para execuções remotas, e em
um arquivo secreto local controlado pelo operador para execuções locais.

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

No longo prazo, o pool de credenciais do Convex deve continuar sendo a fonte normal para credenciais de
transporte live. Segredos do GitHub inicializam o broker e as faixas de fallback.
O workflow de reações de status do Discord mapeia os segredos Crabbox do Mantis de volta para
as variáveis de ambiente `CRABBOX_COORDINATOR` e `CRABBOX_COORDINATOR_TOKEN`
que a CLI do Crabbox espera. Os nomes simples de segredos do GitHub `CRABBOX_*` continuam
aceitos como fallback de compatibilidade.

O runner do Mantis nunca deve imprimir:

- tokens de bots do Discord
- chaves de API de provedores
- cookies do navegador
- conteúdo de perfis de autenticação
- senhas de VNC
- payloads brutos de credenciais

Uploads públicos de artefatos também devem redigir metadados de destino do Discord, como ids de bot,
guild, canal e mensagem. O workflow de smoke do GitHub habilita
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` por esse motivo.

Se um token for acidentalmente colado em uma issue, PR, chat ou log, faça rotação dele
depois que o novo segredo tiver sido armazenado.

## Artefatos do GitHub e Comentários em PRs

Workflows do Mantis devem fazer upload do pacote completo de evidências como um artefato do Actions
de curta duração. Quando o workflow for executado para um relatório de bug ou PR de correção, ele também deve
publicar as capturas de tela PNG redigidas no branch `qa-artifacts` e fazer upsert de um
comentário nesse bug ou PR de correção com capturas de tela inline de antes/depois. Não publique
a prova principal somente em um PR genérico de automação de QA. Logs brutos, mensagens observadas
e outras evidências volumosas ficam no artefato do Actions.

Workflows de produção devem publicar esses comentários com o GitHub App do Mantis, não
com `github-actions[bot]`. Armazene o id do app e a chave privada como segredos do GitHub Actions
`MANTIS_GITHUB_APP_ID` e `MANTIS_GITHUB_APP_PRIVATE_KEY`. O workflow usa um marcador oculto
como chave de upsert, atualiza esse comentário quando o token consegue editá-lo e cria um novo
comentário de propriedade do Mantis quando um marcador antigo de propriedade de bot não pode ser editado.

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

Quando a execução falhar porque o harness falhou, o comentário deve dizer isso em vez de
dar a entender que o candidate falhou.

## Notas de Implantação Privada

Uma implantação privada talvez já tenha uma aplicação Discord do Mantis. Reutilize essa
aplicação em vez de criar outro app quando ela tiver as permissões de bot corretas
e puder ter rotação feita com segurança.

Defina o canal inicial de notificações de operadores por meio de segredos ou configuração de implantação.
Ele pode apontar primeiro para um canal existente de mantenedores ou operações, depois migrar para um
canal dedicado do Mantis quando um existir.

Não coloque ids de guild, ids de canal, tokens de bot, cookies do navegador ou senhas de VNC
neste documento. Armazene-os em segredos do GitHub, no broker de credenciais ou no
armazenamento local de segredos do operador.

## Adicionando um Cenário

Um cenário do Mantis deve declarar:

- id e título
- transporte
- credenciais necessárias
- política de ref da baseline
- política de ref do candidate
- patch de configuração do OpenClaw
- etapas de configuração
- estímulo
- oracle esperado da baseline
- oracle esperado do candidate
- alvos de captura visual
- orçamento de timeout
- etapas de limpeza

Cenários devem preferir oracles pequenos e tipados:

- estado de reações do Discord para bugs de reações
- referências de mensagens do Discord para bugs de threading
- ts de thread do Slack e estado da API de reações para bugs do Slack
- ids e cabeçalhos de mensagens de email para bugs de email
- capturas de tela do navegador quando a UI é o único observável confiável

Verificações de visão devem ser aditivas. Se uma API de plataforma puder provar o bug, use a
API como oracle de aprovação/falha e mantenha capturas de tela para confiança humana.

## Expansão de Provedores

Depois do Discord, o mesmo runner pode adicionar:

- Slack: reações, threads, menções ao app, modais, uploads de arquivos.
- Email: autenticação do Gmail e threading de mensagens usando `gog` onde os conectores não forem
  suficientes.
- WhatsApp: login por QR, reidentificação, entrega de mensagens, mídia, reações.
- Telegram: controle de menções em grupo, comandos, reações onde disponíveis.
- Matrix: salas criptografadas, relações de thread ou resposta, retomada após reinício.

Cada transporte deve ter um cenário smoke barato e um ou mais cenários por classe de bug.
Cenários visuais caros devem permanecer opt-in.

## Perguntas em Aberto

- Qual bot do Discord deve ser o driver e qual deve ser o SUT quando o
  bot existente do Mantis for reutilizado?
- O login do navegador observador deve usar uma conta humana do Discord, uma conta de teste
  ou apenas evidência REST legível por bot na primeira fase?
- Por quanto tempo o GitHub deve reter artefatos do Mantis para PRs?
- Quando o ClawSweeper deve recomendar automaticamente o Mantis em vez de esperar por um
  comando de mantenedor?
- As capturas de tela devem ser redigidas ou recortadas antes do upload para PRs públicos?
