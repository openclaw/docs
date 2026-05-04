---
read_when:
    - Criar ou executar QA visual ao vivo para bugs do OpenClaw
    - Adição de verificação antes e depois para uma solicitação de pull
    - Adicionando cenários de transporte em tempo real do Discord, Slack, WhatsApp ou outros
    - Depuração de execuções de garantia de qualidade que precisam de capturas de tela, automação de navegador ou acesso VNC
summary: Mantis é o sistema de verificação visual de ponta a ponta para reproduzir bugs do OpenClaw em transportes ativos, capturar evidências antes e depois e anexar artefatos a solicitações de integração.
title: Louva-a-deus
x-i18n:
    generated_at: "2026-05-04T02:22:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a86ab4bc876d1c53ada1c30580034165f028194a072f559eb54a898a369211d
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis é o sistema de verificação ponta a ponta do OpenClaw para erros que precisam de um
ambiente de execução real, um transporte real e prova visível. Ele executa um cenário contra uma ref
sabidamente ruim, captura evidências, executa o mesmo cenário contra uma ref candidata e
publica a comparação como artefatos que um mantenedor pode inspecionar a partir de um PR ou
de um comando local.

Mantis começa com Discord porque Discord nos dá uma primeira linha de alto valor:
autenticação real de bot, canais reais de guilda, reações, threads, comandos nativos e uma
UI de navegador em que humanos podem confirmar visualmente o que o transporte mostrou.

## Objetivos

- Reproduzir um erro de uma issue ou PR do GitHub com o mesmo formato de transporte que os usuários
  veem.
- Capturar um artefato **antes** na ref de linha de base antes de aplicar a correção.
- Capturar um artefato **depois** na ref candidata depois de aplicar a correção.
- Usar um oráculo determinístico sempre que possível, como uma leitura de reação via REST do Discord
  ou verificação de transcrição do canal.
- Capturar capturas de tela quando o erro tiver uma superfície de UI visível.
- Executar localmente a partir de uma CLI controlada por agente e remotamente a partir do GitHub.
- Preservar estado de máquina suficiente para resgate via VNC quando login, automação de navegador ou
  autenticação de provedor travar.
- Publicar status conciso em um canal Discord de operadores quando a execução estiver bloqueada,
  precisar de ajuda manual via VNC ou terminar.

## Não Objetivos

- Mantis não substitui testes unitários. Uma execução do Mantis normalmente deve virar
  um teste de regressão menor depois que a correção for entendida.
- Mantis não é o gate normal de CI rápida. Ele é mais lento, usa credenciais reais e
  é reservado para erros em que o ambiente real importa.
- Mantis não deve exigir um humano para operação normal. VNC manual é um caminho de resgate,
  não o caminho feliz.
- Mantis não armazena segredos brutos em artefatos, logs, capturas de tela, relatórios Markdown
  ou comentários de PR.

## Propriedade

Mantis vive na pilha de QA do OpenClaw.

- OpenClaw é responsável pelo runtime de cenário, adaptadores de transporte, esquema de evidências e
  CLI local em `pnpm openclaw qa mantis`.
- QA Lab é responsável pelas partes do harness de transporte real, auxiliares de captura de navegador e
  gravadores de artefatos.
- Crabbox é responsável por máquinas Linux aquecidas quando uma VM remota é necessária.
- GitHub Actions é responsável pelo ponto de entrada do workflow remoto e pela retenção de artefatos.
- ClawSweeper é responsável pelo roteamento de comentários do GitHub: analisar comandos de mantenedores,
  despachar o workflow e publicar o comentário final no PR.
- Agentes OpenClaw conduzem Mantis por meio do Codex quando um cenário precisa de configuração agentica,
  depuração ou relatório de estado travado.

Esse limite mantém o conhecimento de transporte no OpenClaw, o agendamento de máquinas no
Crabbox e a cola do workflow de mantenedores no ClawSweeper.

## Formato Do Comando

O primeiro comando local verifica o bot Discord, guilda, canal, envio de mensagem,
envio de reação e caminho de artefato:

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
`--allow-failures`, depois escreve `baseline/`, `candidate/`, `comparison.json`,
e `mantis-report.md`. Para o primeiro cenário Discord, uma verificação bem-sucedida
significa que o status da linha de base é `fail` e o status da candidata é `pass`.

O primeiro primitivo de VM/navegador é o smoke de desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Ele aluga ou reutiliza uma máquina desktop Crabbox, inicia um navegador visível dentro da
sessão VNC, captura o desktop, puxa artefatos de volta para o diretório de saída local
e escreve o comando de reconexão no relatório. O comando usa por padrão o provedor
Hetzner porque ele é o primeiro provedor com cobertura funcional de desktop/VNC
na linha Mantis. Sobrescreva com `--provider`, `--crabbox-bin` ou
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` ao executar contra outra frota Crabbox.

Flags úteis do smoke de desktop:

- `--lease-id <cbx_...>` ou `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` reutiliza um desktop aquecido.
- `--browser-url <url>` altera a página aberta no navegador visível.
- `--html-file <path>` renderiza um artefato HTML local do repo no navegador visível. Mantis usa isso para capturar a linha do tempo gerada de reações de status do Discord por meio de um desktop Crabbox real.
- `--keep-lease` ou `OPENCLAW_MANTIS_KEEP_VM=1` mantém um lease recém-criado e aprovado aberto para inspeção via VNC. Execuções com falha mantêm o lease por padrão quando um foi criado, para que um operador possa se reconectar.
- `--class`, `--idle-timeout` e `--ttl` ajustam o tamanho da máquina e a duração do lease.

O workflow de smoke do GitHub é `Mantis Discord Smoke`. O workflow GitHub de antes e depois
para o primeiro cenário real é `Mantis Discord Status Reactions`. Ele aceita:

- `baseline_ref`: a ref esperada para reproduzir comportamento somente em fila.
- `candidate_ref`: a ref esperada para mostrar `queued -> thinking -> done`.

Ele faz checkout da ref do harness do workflow, compila worktrees separadas de linha de base e candidata,
executa `discord-status-reactions-tool-only` contra cada worktree e
envia `baseline/`, `candidate/`, `comparison.json` e `mantis-report.md` como
artefatos do Actions. Ele também renderiza o HTML de linha do tempo de cada linha em um navegador
desktop Crabbox e publica essas capturas de tela VNC ao lado dos PNGs determinísticos
de linha do tempo no comentário do PR. O workflow compila a CLI Crabbox a partir de
`openclaw/crabbox` main para poder usar as flags atuais de lease de desktop/navegador
antes que a próxima versão binária do Crabbox seja lançada.

Você também pode acionar a execução de reações de status diretamente a partir de um comentário de PR:

```text
@Mantis discord status reactions
```

O gatilho de comentário é intencionalmente estreito. Ele só é executado em comentários de pull request
de usuários com acesso de escrita, manutenção ou administração, e só reconhece
solicitações de reações de status do Discord. Por padrão, ele usa a ref de linha de base
sabidamente ruim e o SHA atual do head do PR como candidato. Mantenedores podem sobrescrever qualquer uma das
refs:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Exemplos de comandos do ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

O primeiro comando é explícito e focado no cenário. O segundo pode futuramente mapear um PR
ou issue para cenários Mantis recomendados a partir de labels, arquivos alterados e
achados de revisão do ClawSweeper.

## Ciclo De Vida Da Execução

1. Obter credenciais.
2. Alocar ou reutilizar uma VM.
3. Preparar o perfil de desktop/navegador quando o cenário precisar de evidência de UI.
4. Preparar um checkout limpo para a ref de linha de base.
5. Instalar dependências e compilar apenas o que o cenário precisa.
6. Iniciar um Gateway OpenClaw filho com um diretório de estado isolado.
7. Configurar o transporte real, provedor, modelo e perfil de navegador.
8. Executar o cenário e capturar evidências da linha de base.
9. Parar o gateway e preservar logs.
10. Preparar a ref candidata na mesma VM.
11. Executar o mesmo cenário e capturar evidências da candidata.
12. Comparar os resultados do oráculo e as evidências visuais.
13. Escrever Markdown, JSON, logs, capturas de tela e artefatos opcionais de rastreamento.
14. Enviar artefatos do GitHub Actions.
15. Publicar uma mensagem concisa de status no PR ou no Discord.

O cenário deve poder falhar de duas formas diferentes:

- **Erro reproduzido**: a linha de base falhou da forma esperada.
- **Falha do harness**: configuração de ambiente, credenciais, API do Discord, navegador ou
  provedor falhou antes que o oráculo do erro fosse significativo.

O relatório final deve separar esses casos para que mantenedores não confundam um ambiente
instável com comportamento do produto.

## MVP Do Discord

O primeiro cenário deve mirar reações de status do Discord em canais de guilda em que
o modo de entrega da resposta de origem é `message_tool_only`.

Por que ele é uma boa semente para o Mantis:

- Ele é visível no Discord como reações na mensagem disparadora.
- Ele tem um oráculo REST forte por meio do estado de reação da mensagem do Discord.
- Ele exercita um Gateway OpenClaw real, autenticação de bot Discord, despacho de mensagem,
  modo de entrega da resposta de origem, estado de reação de status e ciclo de vida de turno do modelo.
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

As evidências da linha de base devem mostrar a reação de confirmação em fila, mas nenhuma
transição de ciclo de vida no modo somente ferramenta. As evidências da candidata devem mostrar reações de status
de ciclo de vida rodando quando `messages.statusReactions.enabled` está explicitamente
true.

A primeira fatia executável é o cenário QA Discord real opt-in:

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
sonda a mensagem disparadora real do Discord e espera a sequência observada
`👀 -> 🤔 -> 👍`. Os artefatos incluem `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` e
`discord-status-reactions-tool-only-timeline.png`.

## Peças De QA Existentes

Mantis deve se apoiar na pilha privada de QA existente em vez de começar do
zero:

- `pnpm openclaw qa discord` já executa uma linha Discord real com bots de driver e
  SUT.
- O executor de transporte real já escreve relatórios e artefatos de mensagens observadas
  sob `.artifacts/qa-e2e/`.
- Leases de credenciais Convex já fornecem acesso exclusivo a credenciais compartilhadas de
  transporte real.
- O serviço de controle de navegador já oferece suporte a capturas de tela, snapshots,
  perfis gerenciados headless e perfis CDP remotos.
- QA Lab já tem uma UI de depuração e barramento para testes no formato de transporte.

A primeira implementação do Mantis pode ser um executor fino de antes/depois sobre essas
peças, mais uma camada de evidência visual.

## Modelo De Evidências

Toda execução escreve um diretório estável de artefatos:

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
- provedor da máquina e id da máquina ou id do lease
- fonte de credencial sem valores secretos
- resultado da linha de base
- resultado da candidata
- se o erro foi reproduzido na linha de base
- se a candidata o corrigiu
- caminhos dos artefatos
- problemas sanitizados de configuração ou limpeza

Capturas de tela são evidências, não segredos. Elas ainda precisam de disciplina de redação:
nomes de canais privados, nomes de usuários ou conteúdo de mensagens podem aparecer. Para PRs públicos,
prefira links de artefatos do GitHub Actions em vez de imagens inline até que a história de redação
esteja mais forte.

## Navegador E VNC

A linha de navegador tem dois modos:

- **Automação headless**: padrão para CI. Chrome roda com CDP habilitado, e
  Playwright ou o controle de navegador do OpenClaw captura screenshots.
- **Resgate via VNC**: habilitado na mesma VM quando login, MFA, anti-automação do Discord,
  ou depuração visual precisa de um humano.

O perfil de navegador do observador do Discord deve ser persistente o suficiente para evitar
login a cada execução, mas isolado do estado do navegador pessoal. Um perfil
pertence ao pool de máquinas do Mantis, não a um laptop de desenvolvedor.

Quando o Mantis fica preso, ele publica uma mensagem de status no Discord com:

- id da execução
- id do cenário
- provedor da máquina
- diretório de artefatos
- instruções de conexão VNC ou noVNC, se disponíveis
- texto curto do bloqueio

A primeira implantação privada pode publicar essas mensagens no canal de operadores
existente e migrar para um canal dedicado do Mantis mais tarde.

## Máquinas

O Mantis deve preferir AWS por meio do Crabbox na primeira implementação remota.
O Crabbox nos dá máquinas aquecidas, rastreamento de concessões, hidratação, logs, resultados e
limpeza. Se a capacidade da AWS estiver lenta demais ou indisponível, adicione um provedor Hetzner
por trás da mesma interface de máquina.

Requisitos mínimos da VM:

- Linux com instalação do Chrome ou Chromium com suporte a desktop
- acesso CDP para automação do navegador
- VNC ou noVNC para resgate
- Node 22 e pnpm
- checkout do OpenClaw e cache de dependências
- cache do navegador Chromium do Playwright quando o Playwright for usado
- CPU e memória suficientes para um OpenClaw Gateway, um navegador e uma execução de modelo
- acesso de saída ao Discord, GitHub, provedores de modelo e ao broker de credenciais

A VM não deve manter segredos brutos de longa duração fora dos armazenamentos esperados de credenciais ou
perfil de navegador.

## Segredos

Segredos ficam em segredos de organização ou repositório do GitHub para execuções remotas, e em
um arquivo de segredos local controlado pelo operador para execuções locais.

Nomes de segredos recomendados:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para uploads públicos de artefatos no GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

No longo prazo, o pool de credenciais do Convex deve continuar sendo a fonte normal de credenciais
de transporte ao vivo. Segredos do GitHub inicializam o broker e as pistas de fallback.
O fluxo de trabalho de reações de status do Discord mapeia os segredos do Mantis Crabbox de volta para
as variáveis de ambiente `CRABBOX_COORDINATOR` e `CRABBOX_COORDINATOR_TOKEN`
que a CLI do Crabbox espera. Os nomes simples de segredos do GitHub `CRABBOX_*` continuam
aceitos como fallback de compatibilidade.

O executor do Mantis nunca deve imprimir:

- tokens de bot do Discord
- chaves de API de provedores
- cookies do navegador
- conteúdo de perfis de autenticação
- senhas de VNC
- payloads brutos de credenciais

Uploads públicos de artefatos também devem redigir metadados de destino do Discord, como ids de bot,
guild, canal e mensagem. O fluxo de trabalho smoke do GitHub habilita
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` por esse motivo.

Se um token for colado acidentalmente em uma issue, PR, chat ou log, faça a rotação dele
depois que o novo segredo tiver sido armazenado.

## Artefatos do GitHub e comentários em PRs

Os fluxos de trabalho do Mantis devem fazer upload do pacote completo de evidências como um artefato de Actions
de curta duração. Quando o fluxo de trabalho for executado para um relatório de bug ou PR de correção, ele também deve
publicar as capturas de tela PNG redigidas no branch `qa-artifacts` e atualizar ou inserir um
comentário nesse bug ou PR de correção com capturas de tela antes/depois embutidas. Não publique
a prova principal apenas em um PR genérico de automação de QA. Logs brutos, mensagens observadas
e outras evidências volumosas ficam no artefato de Actions.

Fluxos de trabalho de produção devem publicar esses comentários com o GitHub App do Mantis, não
com `github-actions[bot]`. Armazene o id do app e a chave privada como segredos
`MANTIS_GITHUB_APP_ID` e `MANTIS_GITHUB_APP_PRIVATE_KEY` do GitHub Actions.
O fluxo de trabalho usa um marcador oculto como chave de atualização/inserção, atualiza esse
comentário quando o token pode editá-lo e cria um novo comentário de propriedade do Mantis quando
um marcador mais antigo de propriedade do bot não pode ser editado.

O comentário no PR deve ser curto e visual:

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

Quando a execução falhar porque o harness falhou, o comentário deve dizer isso em vez
de sugerir que o candidato falhou.

## Notas de implantação privada

Uma implantação privada talvez já tenha uma aplicação Discord do Mantis. Reutilize essa
aplicação em vez de criar outro app quando ela tiver as permissões de bot corretas
e puder passar por rotação com segurança.

Defina o canal inicial de notificação de operadores por meio de segredos ou configuração de implantação.
Ele pode apontar primeiro para um canal existente de mantenedores ou operações
e depois migrar para um canal dedicado do Mantis quando um existir.

Não coloque ids de guild, ids de canal, tokens de bot, cookies de navegador ou senhas de VNC
neste documento. Armazene-os em segredos do GitHub, no broker de credenciais ou no
armazenamento local de segredos do operador.

## Adicionando um cenário

Um cenário do Mantis deve declarar:

- id e título
- transporte
- credenciais obrigatórias
- política de ref de baseline
- política de ref de candidato
- patch de configuração do OpenClaw
- etapas de setup
- estímulo
- oráculo esperado de baseline
- oráculo esperado de candidato
- alvos de captura visual
- orçamento de timeout
- etapas de limpeza

Cenários devem preferir oráculos pequenos e tipados:

- estado de reação do Discord para bugs de reação
- referências de mensagens do Discord para bugs de threading
- ts da thread do Slack e estado da API de reação para bugs do Slack
- ids e cabeçalhos de mensagens de email para bugs de email
- capturas de tela do navegador quando a UI for o único observável confiável

Verificações por visão devem ser aditivas. Se uma API da plataforma puder provar o bug, use a
API como oráculo de aprovação/falha e mantenha as capturas de tela para confiança humana.

## Expansão de provedores

Depois do Discord, o mesmo executor pode adicionar:

- Slack: reações, threads, menções ao app, modais, uploads de arquivos.
- Email: autenticação do Gmail e threading de mensagens usando `gog` onde conectores não forem
  suficientes.
- WhatsApp: login por QR, reidentificação, entrega de mensagens, mídia, reações.
- Telegram: bloqueio por menção em grupo, comandos, reações quando disponíveis.
- Matrix: salas criptografadas, relações de thread ou resposta, retomada após reinício.

Cada transporte deve ter um cenário smoke barato e um ou mais cenários de classe de bug.
Cenários visuais caros devem permanecer opt-in.

## Perguntas em aberto

- Qual bot do Discord deve ser o driver, e qual deve ser o SUT, quando o
  bot existente do Mantis for reutilizado?
- O login do navegador observador deve usar uma conta humana do Discord, uma conta de teste
  ou apenas evidência REST legível por bot para a primeira fase?
- Por quanto tempo o GitHub deve reter artefatos do Mantis para PRs?
- Quando o ClawSweeper deve recomendar automaticamente o Mantis em vez de esperar por um
  comando de mantenedor?
- As capturas de tela devem ser redigidas ou cortadas antes do upload para PRs públicos?
