---
read_when:
    - Entendendo como a pilha de QA se integra
    - Estendendo o qa-lab, o qa-channel ou um adaptador de transporte
    - Adicionando cenários de QA respaldados pelo repositório
    - Criando uma automação de QA mais realista para o painel do Gateway
summary: 'Visão geral da pilha de QA: qa-lab, qa-channel, cenários baseados em repositório, fluxos de transporte em produção, adaptadores de transporte e geração de relatórios.'
title: Visão geral de QA
x-i18n:
    generated_at: "2026-07-12T21:29:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f82422737f5151bb971e93f830e3e7139c6f60887a33206d5d44259e4f5e51e7
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

A pilha privada de QA exercita o OpenClaw de uma maneira realista, estruturada como um canal, que
um teste unitário não consegue reproduzir.

Componentes:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies de DM, canal, thread,
  reação, edição e exclusão.
- `extensions/qa-lab`: interface de depuração e barramento de QA para observar a transcrição,
  injetar mensagens recebidas e exportar um relatório em Markdown.
- `extensions/qa-matrix`: adaptador de transporte em produção que aciona o Plugin Matrix real
  dentro de um gateway de QA filho.
- `qa/`: ativos iniciais armazenados no repositório para a tarefa de kickoff e cenários de QA
  de referência.
- [Mantis](/pt-BR/concepts/mantis): verificação em produção de antes/depois para bugs que
  exigem transportes reais, capturas de tela do navegador, estado da VM e evidências do PR.

## Superfície de comandos

Todo fluxo de QA é executado em `pnpm openclaw qa <subcommand>`. Muitos têm aliases de script
`pnpm qa:*`; ambas as formas funcionam.

| Comando                                             | Finalidade                                                                                                                                                                                                                                                           |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autoverificação de QA integrada sem `--qa-profile`; executor de perfil de maturidade baseado em taxonomia com `--qa-profile smoke-ci`, `--qa-profile release` ou `--qa-profile all`.                                                                                  |
| `qa suite`                                          | Executa cenários armazenados no repositório na via do gateway de QA. `--runner multipass` usa uma VM Linux descartável em vez do host.                                                                                                                               |
| `qa coverage`                                       | Exibe o inventário YAML de cobertura de cenários (`--json` para saída legível por máquina; `--match <query>` para encontrar cenários de um comportamento alterado; `--tools` para cobertura de fixtures de ferramentas do runtime).                                   |
| `qa parity-report`                                  | Compara dois arquivos `qa-suite-summary.json` para um gate de paridade no eixo de modelos ou usa `--runtime-axis --token-efficiency` para gerar relatórios de paridade de runtime entre Codex e OpenClaw e de eficiência de tokens.                                   |
| `qa confidence-report`                              | Classifica artefatos de comprovação de QA em relação a um manifesto, gerando um relatório de confiança sem itens desconhecidos.                                                                                                                                      |
| `qa confidence-self-test`                           | Grava canários de controle negativo com dados iniciais que comprovam que o gate de confiança detecta desvios.                                                                                                                                                        |
| `qa jsonl-replay`                                   | Reproduz transcrições JSONL selecionadas por meio do harness de reprodução de paridade de runtime.                                                                                                                                                                   |
| `qa character-eval`                                 | Executa o cenário de QA de personagem em vários modelos em produção, com um relatório avaliado. Consulte [Relatórios](#reporting).                                                                                                                                  |
| `qa manual`                                         | Executa um prompt avulso na via de provedor/modelo selecionada.                                                                                                                                                                                                      |
| `qa ui`                                             | Inicia a interface de depuração de QA e o barramento local de QA (alias: `pnpm qa:lab:ui`).                                                                                                                                                                          |
| `qa docker-build-image`                             | Compila a imagem Docker de QA pré-criada.                                                                                                                                                                                                                            |
| `qa docker-scaffold`                                | Grava uma estrutura docker-compose para a via do painel de QA + gateway.                                                                                                                                                                                             |
| `qa up`                                             | Compila o site de QA, inicia a pilha baseada em Docker e exibe a URL (alias: `pnpm qa:lab:up`; a variante `:fast` adiciona `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                   |
| `qa aimock`                                         | Inicia apenas o servidor do provedor AIMock.                                                                                                                                                                                                                         |
| `qa mock-openai`                                    | Inicia apenas o servidor do provedor `mock-openai`, que reconhece cenários.                                                                                                                                                                                          |
| `qa credentials doctor` / `add` / `list` / `remove` | Gerencia o pool compartilhado de credenciais do Convex.                                                                                                                                                                                                              |
| `qa discord`                                        | Via de transporte em produção em um canal real de um servidor privado do Discord.                                                                                                                                                                                    |
| `qa matrix`                                         | Via de transporte em produção em um homeserver Tuwunel descartável. Consulte [QA do Matrix](/pt-BR/concepts/qa-matrix).                                                                                                                                                    |
| `qa slack`                                          | Via de transporte em produção em um canal privado real do Slack.                                                                                                                                                                                                     |
| `qa telegram`                                       | Via de transporte em produção em um grupo privado real do Telegram.                                                                                                                                                                                                  |
| `qa whatsapp`                                       | Via de transporte em produção em contas reais do WhatsApp Web.                                                                                                                                                                                                       |
| `qa mantis`                                         | Executor de verificação de antes/depois para bugs de transporte em produção, com evidências de reações de status no Discord, smoke test de desktop/navegador no Crabbox e smoke test do Slack no VNC. Consulte [Mantis](/pt-BR/concepts/mantis) e [Runbook do Mantis para o Slack Desktop](/pt-BR/concepts/mantis-slack-desktop-runbook). |

`qa matrix` é registrado como um plugin de executor (`extensions/qa-matrix`);
todas as outras faixas acima são integradas diretamente ao `qa-lab`.

### `qa run` baseado em perfil

O `qa run` baseado em perfil lê a associação em `taxonomy.yaml` e, em seguida,
despacha os cenários resolvidos por meio de `qa suite`. `--surface` e
`--category` filtram o perfil selecionado, em vez de definir faixas separadas.
O `qa-evidence.json` resultante inclui um resumo do quadro de pontuação do perfil
com contagens das categorias selecionadas e IDs de cobertura ausentes; as
entradas individuais de evidências continuam sendo a fonte da verdade para os
testes, as funções de cobertura e os resultados. Os IDs de cobertura de recursos
da taxonomia são alvos exatos de comprovação, não aliases: a cobertura do cenário
primário satisfaz os IDs correspondentes, enquanto a cobertura secundária
permanece apenas consultiva. Os IDs de cobertura usam o formato pontilhado
`namespace.behavior`, com segmentos alfanuméricos em minúsculas ou com hífens;
os IDs de perfil, superfície e categoria ainda podem usar os IDs de taxonomia
existentes com hífens ou pontos.

Evidências compactas omitem o campo `execution` de cada entrada e definem `evidenceMode: "slim"`;
`smoke-ci` usa o modo compacto por padrão, e `--evidence-mode full` restaura as entradas completas:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Use `smoke-ci` para obter provas determinísticas de perfil com provedores de modelo simulados e
servidores locais de provedor Crabline. Use `release` para provas de versão estável/LTS em
canais ativos. Use `all` somente para execuções explícitas de evidências da taxonomia completa; ele
seleciona todas as categorias de maturidade ativas e pode ser acionado pelo fluxo de trabalho `QA
Profile Evidence` do GitHub Actions com `qa_profile=all`. Quando um
comando também precisar de um perfil raiz do OpenClaw, coloque o perfil raiz antes do
comando de QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Fluxo do operador

O fluxo atual do operador de QA é um site de QA com dois painéis:

- À esquerda: painel do Gateway (UI de controle) com o agente.
- À direita: QA Lab, mostrando a transcrição no estilo do Slack e o plano do cenário.

Execute-o com:

```bash
pnpm qa:lab:up
```

Isso compila o site de QA, inicia a faixa do Gateway baseada em Docker e disponibiliza
a página do QA Lab, onde um operador ou loop de automação pode atribuir ao agente uma
missão de QA, observar o comportamento real do canal e registrar o que funcionou, falhou ou
permaneceu bloqueado.

Para iterar mais rapidamente na UI do QA Lab sem recompilar a imagem do Docker a cada vez,
inicie a pilha com um pacote do QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantém os serviços do Docker em uma imagem pré-compilada e
monta por bind `extensions/qa-lab/web/dist` no contêiner `qa-lab`.
`qa:lab:watch` recompila esse pacote quando há alterações, e o navegador recarrega
automaticamente quando o hash dos ativos do QA Lab muda.

### Testes rápidos de observabilidade

<Note>
O QA de observabilidade permanece disponível apenas no checkout do código-fonte. O tarball do npm
omite intencionalmente o QA Lab (e `qa-channel`/`qa-matrix`), portanto as faixas de lançamento
do Docker para pacotes não executam comandos `qa`. Execute-os a partir de um checkout compilado
do código-fonte ao alterar a instrumentação de diagnóstico.
</Note>

| Alias                                   | O que executa                                                                                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm qa:otel:smoke`                    | Receptor OpenTelemetry local mais o cenário `otel-trace-smoke` com `diagnostics-otel` habilitado.                                                |
| `pnpm qa:otel:collector-smoke`          | A mesma via por trás de um contêiner Docker real do OpenTelemetry Collector. Use-a ao alterar a conexão de endpoints ou a compatibilidade com Collector/OTLP. |
| `pnpm qa:prometheus:smoke`              | O cenário `docker-prometheus-smoke` com `diagnostics-prometheus` habilitado.                                                                     |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke` seguido de `qa:prometheus:smoke`.                                                                                                |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke` seguido de `qa:prometheus:smoke`.                                                                                      |

`qa:otel:smoke` inicia um receptor OTLP/HTTP local, executa um turno mínimo do
agente do canal de QA e, em seguida, verifica se traces, métricas e logs são
exportados. Ele decodifica os spans de trace protobuf exportados e verifica o
formato crítico para a versão: `openclaw.run`, `openclaw.harness.run`, um span
de chamada de modelo da convenção semântica GenAI mais recente,
`openclaw.context.assembled` e `openclaw.message.delivery` devem estar
presentes. O smoke força
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, portanto o span de
chamada de modelo deve usar o nome `{gen_ai.operation.name} {gen_ai.request.model}`;
as chamadas de modelo não devem exportar `StreamAbandoned` em turnos
bem-sucedidos; IDs de diagnóstico brutos e atributos `openclaw.content.*` não
devem aparecer no trace. O prompt do cenário solicita que o modelo responda
com um marcador fixo e omita uma string secreta fixa; os payloads OTLP brutos
não devem conter nenhum dos dois, nem a chave da sessão de QA derivada do ID do
cenário. Ele grava `otel-smoke-summary.json` ao lado dos artefatos da suíte de
QA.

`qa:prometheus:smoke` verifica se scrapes não autenticados são rejeitados e,
em seguida, confirma que o scrape autenticado inclui famílias de métricas
críticas para a versão sem conteúdo do prompt, conteúdo da resposta,
identificadores de diagnóstico brutos, tokens de autenticação ou caminhos
locais.

### Vias de smoke do Matrix

Para uma via de smoke do Matrix com transporte real que não exija credenciais
do provedor de modelo, execute o perfil rápido com o provedor OpenAI simulado
e determinístico:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Para a via do provedor live-frontier, forneça explicitamente credenciais
compatíveis com a OpenAI:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

A referência completa da CLI, o catálogo de perfis/cenários, as variáveis de
ambiente e a organização dos artefatos dessa via estão em
[QA do Matrix](/pt-BR/concepts/qa-matrix). Em resumo: ela provisiona um homeserver
Tuwunel descartável no Docker, registra usuários temporários de
driver/SUT/observador, executa o Plugin real do Matrix dentro de um gateway
filho de QA com escopo limitado a esse transporte (sem `qa-channel`) e, em
seguida, grava um relatório em Markdown, um resumo JSON, um artefato de eventos
observados e um log de saída combinado em
`.artifacts/qa-e2e/matrix-<timestamp>/`.

Os cenários abrangem comportamentos de transporte que testes unitários não
conseguem comprovar de ponta a ponta: bloqueio por menção, políticas para
permitir bots, listas de permissões, respostas de nível superior e em threads,
roteamento de mensagens diretas, tratamento de reações, supressão de edições
recebidas, eliminação de duplicações na repetição após reinicialização,
recuperação de interrupções do homeserver, entrega de metadados de aprovação,
tratamento de mídia e fluxos de inicialização/recuperação/verificação de E2EE
do Matrix. O perfil E2EE da CLI também executa `openclaw matrix encryption setup`
e comandos de verificação no mesmo homeserver descartável antes de verificar
as respostas do gateway.

A CI usa a mesma superfície de comandos em
`.github/workflows/qa-live-transports-convex.yml`. As execuções agendadas e as
execuções manuais padrão usam o perfil rápido do Matrix com credenciais
live-frontier fornecidas pelo QA, `--fast` e
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. A execução manual com
`matrix_profile=all` distribui o trabalho em cinco shards de perfil:
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

### Cenários Mantis do Discord

O Discord também tem cenários opcionais exclusivos do Mantis para reprodução
de bugs. Use `--scenario discord-status-reactions-tool-only` para a linha do
tempo explícita de reações de status ou
`--scenario discord-thread-reply-filepath-attachment` para criar uma thread
real do Discord e verificar se `message.thread-reply` preserva um anexo
`filePath`. Esses cenários ficam fora da via padrão do Discord em ambiente
real porque são sondas de reprodução de antes/depois, e não uma cobertura
ampla de smoke. O fluxo de trabalho Mantis para anexos em threads também pode
adicionar um vídeo de testemunho do Discord Web com uma sessão iniciada quando
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` ou
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` está configurado no ambiente de
QA. Esse perfil de visualização serve apenas para captura visual; a decisão de
aprovação/reprovação ainda vem do oráculo REST do Discord.

Para vias de smoke com transporte real do Discord, Slack, Telegram e WhatsApp:

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

Elas usam como destino um canal real preexistente com dois bots ou contas
(driver + SUT). As variáveis de ambiente obrigatórias, as listas de cenários,
os artefatos de saída e o pool de credenciais do Convex estão documentados na
[referência de QA do Discord, Slack, Telegram e WhatsApp](#discord-slack-telegram-and-whatsapp-qa-reference)
abaixo.

### Executores de tarefas visuais e do aplicativo Slack para desktop do Mantis

Para uma execução completa da VM do Slack para desktop com recuperação por VNC, execute:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Esse comando obtém uma máquina Crabbox com desktop/navegador, executa a
rotina ativa do Slack dentro da VM, abre o Slack Web no navegador VNC, captura
a área de trabalho e copia `slack-qa/`, `slack-desktop-smoke.png` e
`slack-desktop-smoke.mp4` (quando a captura de vídeo está disponível) de volta
para o diretório de artefatos do Mantis. As concessões de desktop/navegador do
Crabbox fornecem antecipadamente as ferramentas de captura e os pacotes
auxiliares de navegador/compilação nativa, portanto o cenário deve instalar
alternativas somente em concessões mais antigas. O Mantis informa os tempos
totais e por fase em `mantis-slack-desktop-smoke-report.md`, para que execuções
lentas mostrem se o tempo foi gasto no aquecimento da concessão, na obtenção
de credenciais, na configuração remota ou na cópia de artefatos. Reutilize
`--lease-id <cbx_...>` depois de entrar manualmente no Slack Web por VNC; as
concessões reutilizadas também mantêm aquecido o cache do armazenamento pnpm
do Crabbox. O padrão `--hydrate-mode source` faz a verificação a partir de um
checkout do código-fonte e executa a instalação/compilação dentro da VM. Use
`--hydrate-mode prehydrated` somente quando o espaço de trabalho remoto
reutilizado já tiver `node_modules` e um `dist/` compilado; esse modo ignora a
etapa onerosa de instalação/compilação e encerra de forma segura com falha
quando o espaço de trabalho não está pronto. Com `--gateway-setup`, o Mantis
deixa um gateway persistente do OpenClaw para Slack em execução dentro da VM
na porta `38973`; sem essa opção, o comando executa a rotina normal de QA do
Slack entre bots e sai após a captura dos artefatos.

Para comprovar a interface nativa de aprovação do Slack com evidências da área
de trabalho, execute o modo de pontos de verificação de aprovação do Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Esse modo é mutuamente exclusivo com `--gateway-setup`. Ele executa os
cenários de aprovação do Slack, rejeita IDs de cenários que não sejam de
aprovação, aguarda cada estado de aprovação pendente e resolvido, renderiza a
mensagem observada da API do Slack em
`approval-checkpoints/<scenario>-pending.png` e
`approval-checkpoints/<scenario>-resolved.png` e, em seguida, falha se algum
ponto de verificação, evidência da mensagem, confirmação ou captura de tela
renderizada estiver ausente ou vazio. Concessões frias de CI ainda podem
mostrar a tela de entrada do Slack em `slack-desktop-smoke.png`; as imagens dos
pontos de verificação de aprovação são a comprovação visual dessa rotina.

A execução padrão dos pontos de verificação mantém os dois cenários padrão de
aprovação do Slack. Para capturar qualquer uma das rotas opcionais de aprovação
do Codex, selecione-a explicitamente com
`--scenario slack-codex-approval-exec-native` ou
`--scenario slack-codex-approval-plugin-native`; o Mantis aceita ambas e gera
o mesmo par de capturas de tela de estado pendente/resolvido. O executor amplia
os prazos dos pontos de verificação e dos comandos remotos para cada rota do
Codex selecionada, permitindo a conclusão de toda a sequência de aprovação,
conclusão do agente e atualização do estado resolvido.

A lista de verificação do operador, o comando de disparo do workflow do GitHub,
o contrato de comentários de evidências, a tabela de decisão do modo de
hidratação, a interpretação dos tempos e as etapas de tratamento de falhas
estão no
[runbook do Mantis para Slack Desktop](/pt-BR/concepts/mantis-slack-desktop-runbook).

Para uma tarefa de desktop no estilo agente/CV, execute:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task` reserva ou reutiliza uma máquina desktop/com navegador do Crabbox, inicia
`crabbox record --while`, controla o navegador visível por meio de um
`visual-driver` aninhado, captura `visual-task.png`, executa `openclaw infer image
describe` na captura de tela quando `--vision-mode image-describe` está
selecionado e grava `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` e
`mantis-visual-task-report.md`. Quando `--expect-text` está definido, o prompt de visão
solicita um veredito JSON estruturado (`visible`, `evidence`, `reason`)
e só é aprovado quando o modelo relata `visible: true` com evidências que
citam o texto esperado; uma resposta `visible: false` que apenas cita o
texto-alvo ainda falha na asserção. Use `--vision-mode metadata` para um
teste rápido sem modelo que comprove o funcionamento integrado do desktop, navegador, captura de tela e vídeo
sem chamar um provedor de compreensão de imagens. A gravação é um
artefato obrigatório para `visual-task`; se o Crabbox não gravar um
`visual-task.mp4` não vazio, a tarefa falhará mesmo que o driver visual tenha sido aprovado. Em
caso de falha, o Mantis mantém a reserva para VNC, a menos que a tarefa já tenha sido aprovada
e `--keep-lease` não tenha sido definido.

### Verificação de integridade do pool de credenciais

Antes de usar credenciais ativas do pool, execute:

```bash
pnpm openclaw qa credentials doctor
```

O doctor verifica as variáveis de ambiente do broker Convex (`OPENCLAW_QA_CONVEX_SITE_URL`,
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`), valida as configurações do endpoint, informa
apenas o status definido/ausente de `OPENCLAW_QA_CONVEX_SECRET_CI` e
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` e verifica a acessibilidade de administração/listagem
quando o segredo do mantenedor está presente.

## Cobertura de transporte em ambiente real

As vias de transporte em ambiente real compartilham um único contrato, em vez de cada uma criar seu próprio
formato de lista de cenários. `qa-channel` é a suíte sintética ampla de comportamento do produto
e não faz parte da matriz de cobertura de transporte em ambiente real.

Os executores de transporte em ambiente real importam os IDs de cenário compartilhados, os auxiliares de
cobertura de referência e o auxiliar de seleção de cenários de
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Fluxo    | Canary | Controle por menção | Bot para bot | Bloqueio por lista de permissões | Resposta de nível superior | Resposta com citação | Retomada após reinício | Continuação em thread | Isolamento de thread | Observação de reação | Comando de ajuda | Registro de comando nativo |
| -------- | ------ | -------------------- | ------------ | --------------------------------- | -------------------------- | -------------------- | ----------------------- | --------------------- | -------------------- | --------------------- | ----------------- | -------------------------- |
| Discord  | x      | x                    | x            |                                   |                            |                      |                         |                       |                      |                       |                   | x                          |
| Matrix   | x      | x                    | x            | x                                 | x                          |                      | x                       | x                     | x                    | x                     |                   |                            |
| Slack    | x      | x                    | x            | x                                 | x                          |                      | x                       | x                     | x                    |                       |                   |                            |
| Telegram | x      | x                    | x            |                                   |                            |                      |                         |                       |                      |                       | x                 |                            |
| WhatsApp | x      | x                    |              | x                                 | x                          | x                    | x                       |                       |                      | x                     | x                 |                            |

Isso mantém `qa-channel` como a ampla suíte de comportamento do produto, enquanto Matrix,
Telegram e os outros transportes ativos compartilham uma única lista de verificação
explícita do contrato de transporte.

Para um fluxo de VM Linux descartável sem introduzir o Docker no caminho de QA, execute:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Isso inicializa um convidado Multipass novo, instala as dependências, compila o OpenClaw
dentro do convidado, executa `qa suite` e então copia o relatório e o
resumo normais de QA de volta para `.artifacts/qa-e2e/...` no host. Ele reutiliza o mesmo
comportamento de seleção de cenários de `qa suite` no host.

As execuções da suíte no host e no Multipass executam vários cenários selecionados em
paralelo, com workers isolados do Gateway por padrão. `qa-channel` usa por padrão
concorrência 4, limitada pela quantidade de cenários selecionados. Use `--concurrency
<count>` para ajustar a quantidade de workers ou `--concurrency 1` para execução serial.
Use `--pack personal-agent` para executar o pacote de benchmarks do assistente pessoal (10
cenários). O seletor de pacote é aditivo com flags `--scenario` repetidas:
os cenários explícitos são executados primeiro e, em seguida, os cenários do pacote são executados na ordem do pacote, com
as duplicatas removidas. Use `--pack observability` para selecionar os cenários
`otel-trace-smoke` e `docker-prometheus-smoke` em conjunto quando um
executor personalizado de QA já fornecer a configuração do coletor OpenTelemetry.

O comando encerra com código diferente de zero quando qualquer cenário falha. Use `--allow-failures`
quando quiser os artefatos sem um código de saída de falha.

As execuções ativas encaminham as entradas de autenticação de QA compatíveis que são práticas para o
convidado: chaves de provedores baseadas em variáveis de ambiente, o caminho da configuração do provedor ativo de QA e
`CODEX_HOME`, quando presente. Mantenha `--output-dir` sob a raiz do repositório para que o
convidado possa gravar de volta pelo workspace montado.

## Referência de QA do Discord, Slack, Telegram e WhatsApp

Matrix tem uma [página dedicada](/pt-BR/concepts/qa-matrix) devido à quantidade de
cenários e ao provisionamento do homeserver baseado em Docker. Discord, Slack, Telegram
e WhatsApp são executados em transportes reais preexistentes, portanto sua referência
fica aqui.

### Flags compartilhadas da CLI

Esses fluxos são registrados por meio de
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e
aceitam as mesmas flags:

| Flag                                  | Padrão                                             | Descrição                                                                                                                                                  |
| ------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Executa somente este cenário. Pode ser repetida.                                                                                                           |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Local onde são gravados relatórios, resumos, evidências, artefatos específicos do transporte e o log de saída. Caminhos relativos são resolvidos em relação a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Raiz do repositório ao invocar a partir de um diretório de trabalho neutro.                                                                                |
| `--sut-account <id>`                  | `sut`                                              | ID temporário da conta na configuração do Gateway de QA.                                                                                                   |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` ou `live-frontier` (o legado `live-openai` ainda funciona).                                                                                   |
| `--model <ref>` / `--alt-model <ref>` | padrão do provedor                                 | Referências dos modelos principal/alternativo.                                                                                                             |
| `--fast`                              | desativado                                         | Modo rápido do provedor, quando compatível.                                                                                                                |
| `--credential-source <env\|convex>`   | `env`                                              | Consulte o [pool de credenciais do Convex](#convex-credential-pool).                                                                                       |
| `--credential-role <maintainer\|ci>`  | `ci` na CI, `maintainer` nos demais casos          | Função usada quando `--credential-source convex`.                                                                                                          |

Cada fluxo encerra com código diferente de zero em caso de falha de qualquer cenário. `--allow-failures` grava
os artefatos sem definir um código de saída de falha. O Telegram também aceita
`--list-scenarios` para exibir os IDs dos cenários disponíveis e encerrar; os outros fluxos
não expõem essa flag.

### QA do Telegram

```bash
pnpm openclaw qa telegram
```

Tem como alvo um grupo privado real do Telegram com dois bots distintos (controlador +
SUT). O bot SUT deve ter um nome de usuário do Telegram; a observação bot para bot funciona
melhor quando ambos os bots têm **Bot-to-Bot Communication Mode** habilitado no
`@BotFather`.

Variáveis de ambiente obrigatórias quando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - ID numérico do chat (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Cenários (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-tool-only-usage-footer`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

O conjunto padrão implícito sempre abrange canary, controle por menção, respostas de comandos
nativos, endereçamento de comandos e respostas bot para bot em grupos. Os padrões de `mock-openai`
também incluem verificações determinísticas da cadeia de respostas e do streaming da mensagem final.
`telegram-current-session-status-tool` e
`telegram-tool-only-usage-footer` permanecem opcionais: o primeiro só é estável
quando executado diretamente após o canary, e o segundo é uma comprovação no Telegram real
do rodapé de `/usage` em respostas que contêm apenas ferramentas. Use `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` para exibir a divisão atual entre
cenários padrão/opcionais com referências de regressão.

Artefatos de saída:

- `telegram-qa-report.md`
- `qa-evidence.json` - entradas de evidência para as verificações do transporte ativo,
  incluindo campos de perfil, cobertura, provedor, canal, artefatos, resultado e RTT.

As execuções do pacote do Telegram usam o mesmo contrato de credenciais do Telegram. A medição repetida de RTT
faz parte do fluxo ativo normal do pacote do Telegram; a distribuição de RTT
é incorporada a `qa-evidence.json` em `result.timing` para a
verificação de RTT selecionada.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Quando `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` está definido, o wrapper da execução ativa do pacote
reserva uma credencial `kind: "telegram"`, exporta as variáveis de ambiente
do grupo/controlador/bot SUT reservadas para a execução do pacote instalado, envia Heartbeats para a reserva e a libera
no encerramento. O wrapper do pacote usa por padrão 20 verificações de RTT de
`telegram-mentioned-message-reply`, um tempo limite de RTT de 30s e a função do Convex
`maintainer` fora da CI quando o Convex está selecionado. Substitua
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
ou `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` para ajustar a medição de RTT sem
criar um comando de RTT separado ou um formato de resumo específico do Telegram.

### QA do Discord

```bash
pnpm openclaw qa discord
```

Tem como alvo um canal de uma guilda privada real do Discord com dois bots: um bot controlador
controlado pelo harness e um bot SUT iniciado pelo Gateway filho do OpenClaw
por meio do Plugin integrado do Discord. Verifica o tratamento de menções no canal, se
o bot SUT registrou o comando nativo `/help` no Discord e
cenários opcionais de evidência do Mantis.

Variáveis de ambiente obrigatórias quando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - deve corresponder ao ID de usuário do bot SUT
  retornado pelo Discord (caso contrário, o fluxo falha imediatamente).

Opcionais:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mantém o conteúdo das mensagens nos
  artefatos de mensagens observadas.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` seleciona o canal de voz/palco para
  `discord-voice-autojoin`; sem ele, o cenário escolhe o primeiro canal de
  voz/palco visível para o bot SUT.

Cenários (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - cenário de voz opcional. É executado isoladamente, habilita
  `channels.discord.voice.autoJoin` e verifica se o estado de voz atual do bot SUT
  no Discord corresponde ao canal de voz/palco de destino. As credenciais do Discord no Convex
  podem incluir o `voiceChannelId` opcional; caso contrário, o executor
  descobre o primeiro canal de voz/palco visível na guilda.
- `discord-status-reactions-tool-only` - cenário opcional do Mantis. É executado
  isoladamente porque muda o SUT para respostas da guilda sempre ativas e somente com ferramentas,
  com `messages.statusReactions.enabled=true`, e então captura uma linha do tempo de
  reações via REST, além de artefatos visuais HTML/PNG. Os relatórios de antes/depois do Mantis
  também preservam os artefatos MP4 fornecidos pelo cenário como `baseline.mp4`
  e `candidate.mp4`.
- `discord-thread-reply-filepath-attachment` - cenário opcional do Mantis; consulte
  [Cenários do Mantis no Discord](#discord-mantis-scenarios).

Execute explicitamente o cenário de entrada automática no canal de voz do Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Execute explicitamente o cenário de reações de status do Mantis:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.6-luna \
  --alt-model openai/gpt-5.6-luna \
  --fast
```

Artefatos de saída:

- `discord-qa-report.md`
- `qa-evidence.json` - entradas de evidência para as verificações de transporte ao vivo.
- `discord-qa-observed-messages.json` - corpos redigidos, a menos que
  `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` e
  `discord-status-reactions-tool-only-timeline.png` quando o cenário de reações
  de status é executado.

### QA do Slack

```bash
pnpm openclaw qa slack
```

Tem como alvo um canal privado real do Slack com dois bots distintos: um bot driver
controlado pelo harness e um bot SUT iniciado pelo Gateway filho do OpenClaw
por meio do Plugin do Slack incluído.

Variáveis de ambiente obrigatórias quando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` mantém os corpos das mensagens nos
  artefatos de mensagens observadas.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` habilita pontos de verificação
  visuais de aprovação para Mantis. O executor grava `<scenario>.pending.json` e
  `<scenario>.resolved.json` e, em seguida, aguarda os arquivos `.ack.json` correspondentes.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` substitui o tempo limite
  de confirmação do ponto de verificação. O padrão é `120000`.

Cenários YAML canônicos expostos por meio do adaptador ao vivo do Slack:

- `thread-follow-up`
- `thread-isolation`

Cenários imperativos do Slack (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`, `slack-progress-commentary-false`,
  `slack-progress-commentary-omitted` e
  `slack-progress-commentary-verbose-dedupe` - sondagens opcionais no Slack real para
  controles independentes de comentários/progresso de ferramentas, o padrão legado
  quando a chave é omitida e o comportamento de entrega única quando o progresso detalhado persistente está ativado.
- `slack-reaction-glyph-native` - cenário opcional de reação ao vivo da ferramenta de mensagens.
  Instrui o agente a fornecer o glifo exato `✅` e confirma que o Slack armazenou
  `white_check_mark` para o bot SUT na mensagem de destino.
- `slack-chart-presentation-native` - cenário opcional de gráfico portátil que
  verifica o bloco nativo `data_visualization` e o texto acessível exato.
- `slack-table-presentation-native` - cenário opcional de tabela portátil que
  verifica o bloco nativo `data_table`, as linhas exatas e o texto acessível.
- `slack-table-invalid-blocks-fallback` - cenário opcional de transporte direto
  que envia uma tabela bruta estruturalmente legível acima do limite, com 101 linhas de dados
  mais o cabeçalho, por meio do
  caminho de envio do Slack em produção, comprova que o próprio Slack retorna `invalid_blocks`
  e verifica se o fallback armazenado com formatação desabilitada está completo e não contém
  nenhum bloco de dados nativo. O relatório mantém apenas evidências seguras de código de erro,
  contagem e valores booleanos; o texto bruto da tabela sintética segue
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT`.
- `slack-approval-exec-native` - cenário opcional de aprovação nativa de execução no Slack.
  Solicita uma aprovação de execução por meio do Gateway, verifica se a mensagem do Slack
  tem botões nativos de aprovação, resolve a solicitação e verifica a atualização resolvida no Slack.
- `slack-approval-plugin-native` - cenário opcional de aprovação nativa de Plugin no Slack.
  Habilita em conjunto o encaminhamento de aprovações de execução e de Plugin para que os eventos
  de Plugin não sejam suprimidos pelo roteamento de aprovação de execução e, em seguida, verifica
  o mesmo fluxo de interface nativa pendente/resolvida do Slack.
- `slack-codex-approval-exec-native` - cenário opcional de aprovação de comando do Codex Guardian.
  Habilita o Plugin do Codex no modo Guardian, encaminha um turno de agente do Gateway
  originado no Slack pelo harness do app-server do Codex,
  aguarda a solicitação nativa de aprovação do Plugin do Slack para
  `openclaw-codex-app-server`, resolve-a e verifica se o turno do Codex
  termina com os marcadores esperados de saída do comando e do assistente.
- `slack-codex-approval-plugin-native` - cenário opcional de aprovação de arquivo do Codex Guardian.
  Usa uma instrução `apply_patch` fora do espaço de trabalho para que o Codex emita
  a rota de aprovação de alteração de arquivo do app-server e, em seguida, verifica o mesmo
  fluxo nativo de aprovação pendente/resolvida do Slack, o marcador final do assistente e o conteúdo
  exato do arquivo antes da limpeza.

Os cenários de aprovação do Codex exigem um `--model` `openai/*` ou `codex/*`, as
credenciais normais do modelo ao vivo e autenticação do Codex ou autenticação por chave de API aceita pelo Plugin do Codex.
O relatório do Slack inclui o método do app-server do Codex, a chave do modelo Codex selecionada,
o status final do turno do Codex e a verificação do marcador de operação, além dos
metadados redigidos de aprovação do Slack.

Artefatos de saída:

- `slack-qa-report.md`
- `qa-evidence.json` - entradas de evidência para as verificações de transporte ao vivo.
- `slack-qa-observed-messages.json` - corpos redigidos, a menos que
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - somente quando Mantis define
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; contém JSON dos pontos de verificação,
  JSON de confirmação e capturas de tela dos estados pendente/resolvido.

#### Configuração do espaço de trabalho do Slack

A lane precisa de dois aplicativos distintos do Slack em um espaço de trabalho, além de um canal do qual ambos
os bots sejam membros:

- `channelId` - o ID `Cxxxxxxxxxx` de um canal para o qual ambos os bots foram
  convidados. Use um canal dedicado; a lane publica a cada execução.
- `driverBotToken` - token do bot (`xoxb-...`) do aplicativo **Driver**.
- `sutBotToken` - token do bot (`xoxb-...`) do aplicativo **SUT**, que deve ser um
  aplicativo Slack separado do driver para que o ID de usuário do bot seja distinto.
- `sutAppToken` - token no nível do aplicativo (`xapp-...`) do aplicativo SUT com
  `connections:write`, usado pelo Socket Mode para que o aplicativo SUT possa receber eventos.

Prefira um espaço de trabalho do Slack dedicado à QA em vez de reutilizar um espaço de trabalho
de produção.

O manifesto do SUT abaixo restringe intencionalmente a instalação de produção do Plugin do Slack
incluído (`extensions/slack/src/setup-shared.ts:12`) às
permissões e aos eventos cobertos pelo conjunto de QA ao vivo do Slack. Para a
configuração do canal de produção conforme apresentada aos usuários, consulte
[configuração rápida do canal do Slack](/pt-BR/channels/slack#quick-setup); o par Driver/SUT de QA
é intencionalmente separado porque a lane precisa de dois IDs distintos de usuário de bot
em um único espaço de trabalho.

**1. Crie o aplicativo Driver**

Acesse [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → escolha o espaço de trabalho de QA, cole o manifesto a seguir
e depois selecione _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Bot driver de teste para a lane ao vivo de QA do Slack do OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Copie o _Bot User OAuth Token_ (`xoxb-...`) - ele se torna
`driverBotToken`. O driver precisa apenas publicar mensagens e identificar
a si mesmo; sem eventos, sem Socket Mode.

**2. Crie o aplicativo SUT**

Repita _Create New App → From a manifest_ no mesmo workspace. Este aplicativo de QA
usa intencionalmente uma versão mais restrita do manifesto de produção do
Plugin Slack incluído (`extensions/slack/src/setup-shared.ts:12`): escopos e
eventos de reação foram omitidos porque a suíte de QA em ambiente real do Slack
ainda não abrange o tratamento de reações.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "Conector OpenClaw QA SUT para o OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Depois que o Slack criar o aplicativo, faça duas coisas na página de configurações dele:

- _Install to Workspace_ → copie o _Bot User OAuth Token_ → ele se torna
  `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → adicione
  o escopo `connections:write` → salve → copie o valor `xapp-...` → ele
  se torna `sutAppToken`.

Verifique se os dois bots têm ids de usuário distintos chamando `auth.test` com
cada token. O runtime diferencia o driver e o SUT pelo id de usuário; reutilizar
um aplicativo para ambos fará a restrição por menção falhar imediatamente.

**3. Crie o canal**

No workspace de QA, crie um canal (por exemplo, `#openclaw-qa`) e convide os dois
bots dentro do canal:

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copie o id `Cxxxxxxxxxx` em _channel info → About → Channel ID_ — ele se
torna `channelId`. Um canal público funciona; se você usar um canal privado,
ambos os aplicativos já têm `groups:history`, portanto as leituras de histórico
do harness continuarão funcionando.

**4. Registre as credenciais**

Há duas opções. Use variáveis de ambiente para depuração em uma única máquina
(defina as quatro variáveis `OPENCLAW_QA_SLACK_*` e passe
`--credential-source env`) ou inicialize o pool compartilhado do Convex para
que a CI e outros mantenedores possam obtê-las por meio de concessão.

Para o pool do Convex, grave os quatro campos em um arquivo JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Com `OPENCLAW_QA_CONVEX_SITE_URL` e `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
exportados no seu shell, registre e verifique:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "Semente do pool de QA do Slack"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Espere `count: 1`, `status: "active"` e nenhum campo `lease`.

**5. Verifique de ponta a ponta**

Execute a lane localmente para confirmar que ambos os bots conseguem se comunicar por meio do
broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Uma execução bem-sucedida é concluída em bem menos de 30 segundos, e `slack-qa-report.md`
mostra tanto `slack-canary` quanto `slack-mention-gating` com o status `pass`. Se a
lane ficar travada por ~90 segundos e encerrar com `Convex credential pool exhausted
for kind "slack"`, o pool está vazio ou todas as linhas estão locadas — `qa
credentials list --kind slack --status all --json` indicará qual é o caso.

### QA do WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Tem como alvo duas contas dedicadas do WhatsApp Web: uma conta de driver controlada pelo
harness e uma conta do SUT iniciada pelo Gateway filho do OpenClaw por meio do
Plugin integrado do WhatsApp.

Variáveis de ambiente obrigatórias ao usar `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Opcional:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` habilita cenários de grupo, como
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, cenários de ações/mídia/enquetes em grupo
  e `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` mantém o corpo das mensagens nos
  artefatos de mensagens observadas.

Catálogo de cenários (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Linha de base e controle de grupo: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`, `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Comandos nativos: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Comportamento de resposta e saída final: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Ações de mensagem no fluxo do usuário: `whatsapp-agent-message-action-react` começa
  com uma DM real do driver, permite que o modelo chame a ferramenta `message` e
  observa a reação nativa do WhatsApp. `whatsapp-agent-message-action-upload-file`
  usa a mesma abordagem para `message(action=upload-file)` e observa
  mídia nativa do WhatsApp. `whatsapp-group-agent-message-action-react` e
  `whatsapp-group-agent-message-action-upload-file` comprovam as mesmas
  ações visíveis ao usuário em um grupo real do WhatsApp.
- Distribuição para grupos: `whatsapp-broadcast-group-fanout` começa com uma mensagem
  mencionada em um grupo do WhatsApp e verifica respostas visíveis distintas de `main`
  e `qa-second`.
- Ativação de grupo: `whatsapp-group-activation-always` altera uma sessão de grupo real
  para `/activation always`, comprova que uma mensagem de grupo sem menção desperta
  o agente e, em seguida, restaura `/activation mention`.
  `whatsapp-group-reply-to-bot-triggers` insere uma resposta do bot, envia uma
  resposta nativa citando-a sem uma menção explícita e verifica se o agente
  desperta a partir desse contexto de resposta.
- Mídia recebida e mensagens estruturadas: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Esses cenários enviam eventos reais de imagem, áudio, documento, localização, contato,
  figurinha e reação do WhatsApp por meio do driver.
- Sondagens diretas do contrato do Gateway: `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-outbound-send-serialization`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Esses cenários ignoram de propósito a solicitação ao modelo
  e comprovam contratos determinísticos de `send`, `poll` e
  `message.action` do Gateway/canal.
- Cobertura de controle de acesso: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Aprovações nativas: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Reações de status: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

O catálogo contém atualmente 52 cenários. A lane padrão `live-frontier`
é mantida pequena, com 10 cenários, para uma cobertura de smoke rápida. A lane padrão
`mock-openai` executa 45 cenários de forma determinística pelo transporte real do WhatsApp,
simulando apenas a saída do modelo; os cenários de aprovação e algumas
verificações mais pesadas/bloqueantes permanecem explícitos por ID de cenário.

O driver de QA do WhatsApp observa eventos ativos estruturados (`text`, `media`,
`location`, `reaction` e `poll`) e pode enviar ativamente mídia, enquetes,
contatos, localizações e figurinhas. O QA Lab importa esse driver pela
superfície do pacote `@openclaw/whatsapp/api.js`, em vez de acessar arquivos privados
do runtime do WhatsApp. Para observações de grupo, `fromJid` é o JID do grupo,
enquanto `participantJid` e `fromPhoneE164` identificam o participante remetente.
O conteúdo das mensagens é ocultado por padrão. As sondagens diretas do Gateway de enquete,
upload de arquivo, mídia, enquete em grupo, mídia em grupo e formato de resposta são verificações
do contrato de transporte/API; elas não são tratadas como prova de que uma solicitação do usuário fez
o agente escolher a mesma ação. A comprovação de ações no fluxo do usuário vem de cenários
como `whatsapp-agent-message-action-react` e
`whatsapp-group-agent-message-action-react`, nos quais o driver envia uma mensagem normal
do WhatsApp e o QA Lab observa o artefato nativo resultante do WhatsApp.
Os relatórios do WhatsApp incluem a abordagem de cada cenário (`user-path`,
`direct-gateway` ou `native-approval`), para que as evidências não sejam confundidas com um
contrato mais forte do que aquele que realmente comprovam.

Artefatos de saída:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - entradas de evidência para as verificações do transporte ativo.
- `whatsapp-qa-observed-messages.json` - corpos ocultados, a menos que
  `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Pool de credenciais do Convex

As lanes do Discord, Slack, Telegram e WhatsApp podem obter credenciais de um
pool compartilhado do Convex, em vez de ler as variáveis de ambiente acima. Passe
`--credential-source convex` (ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`);
o QA Lab adquire uma concessão exclusiva, envia Heartbeats durante toda a
execução e a libera no encerramento. Os tipos do pool são `"discord"`, `"slack"`,
`"telegram"` e `"whatsapp"`.

Formatos de payload que o broker valida em `admin/add`:

- Discord (`kind: "discord"`): `{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string,
sutToken: string }` - `groupId` deve ser uma string numérica de ID de chat.
- Usuário real do Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` -
  somente para comprovação do Telegram Desktop no Mantis. As lanes genéricas do QA Lab não devem adquirir
  esse tipo.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` - os números de telefone devem ser strings E.164 distintas.

O fluxo de trabalho de comprovação do Telegram Desktop no Mantis mantém uma concessão exclusiva
`telegram-user` do Convex tanto para o driver CLI da TDLib quanto para a testemunha do Telegram Desktop
e, em seguida, libera-a após publicar a comprovação.

Quando um PR precisa de uma comparação visual determinística, o Mantis pode usar a mesma resposta
do modelo simulado em `main` e no head do PR enquanto o formatador ou
a camada de entrega do Telegram é alterada. Os padrões de captura são ajustados para comentários de PR: classe
Crabbox padrão, gravação da área de trabalho a 24fps, GIF de movimento a 24fps e largura de
pré-visualização de 1920px. Os comentários de antes/depois devem publicar um pacote limpo que contenha
apenas os GIFs pretendidos.

As lanes do Slack também podem usar o pool. Atualmente, as verificações do formato do payload do Slack ficam
no executor de QA do Slack, e não no broker; use `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`, com um
ID de canal do Slack como `Cxxxxxxxxxx`. Consulte
[Configuração do workspace do Slack](#setting-up-the-slack-workspace) para provisionar aplicativos
e escopos.

As variáveis de ambiente operacionais e o contrato do endpoint do broker do Convex estão em
[Testes → Credenciais compartilhadas do Telegram via Convex](/pt-BR/help/testing#shared-telegram-credentials-via-convex-v1)
(o nome da seção é anterior ao pool multicanal; a semântica das concessões é
compartilhada entre os tipos).

## Seeds armazenadas no repositório

Os recursos de seed ficam em `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Eles ficam intencionalmente no git para que o plano de QA seja visível tanto para humanos quanto
para o agente.

`qa-lab` continua sendo um executor genérico de cenários YAML. Cada arquivo YAML de cenário é a
fonte da verdade para uma execução de teste e deve definir:

- `title` no nível superior
- metadados de `scenario`
- metadados opcionais de categoria, capacidade, lane e risco em `scenario`
- referências de documentação e código em `scenario`
- requisitos opcionais de Plugin em `scenario`
- patch opcional da configuração do Gateway em `scenario`
- `flow` executável no nível superior para cenários de fluxo, ou
  `scenario.execution.kind` / `scenario.execution.path` para cenários do Vitest e
  Playwright

A superfície reutilizável do runtime que sustenta `flow` permanece genérica e
transversal. Por exemplo, os cenários YAML podem combinar auxiliares do lado do
transporte com auxiliares do lado do navegador que controlam a Control UI incorporada por meio
da interface `browser.request` do Gateway, sem adicionar um executor de caso especial.

Os arquivos de cenário devem ser agrupados por capacidade do produto, e não por pasta da
árvore de origem. Mantenha os IDs dos cenários estáveis quando os arquivos forem movidos; use `docsRefs` e
`codeRefs` para rastreabilidade da implementação.

A lista de linha de base deve permanecer abrangente o suficiente para cobrir:

- DM e chat em canal
- comportamento de threads
- ciclo de vida de ações de mensagem
- callbacks de Cron
- recuperação de memória
- troca de modelos
- transferência para subagente
- leitura de repositório e documentação
- uma pequena tarefa de build, como Lobster Invaders

## Lanes de simulação de provedores

`qa suite` tem duas lanes locais de simulação de provedores:

- `mock-openai` é a simulação do OpenClaw ciente dos cenários. Continua sendo a lane
  de simulação determinística padrão para QA armazenada no repositório e gates de paridade.
- `aimock` inicia um servidor de provedor baseado em AIMock para cobertura experimental
  de protocolo, fixtures, gravação/reprodução e caos. Ele é aditivo e
  não substitui o dispatcher de cenários `mock-openai`.

A implementação das lanes de provedores fica em `extensions/qa-lab/src/providers/`.
Cada provedor é responsável por seus padrões, inicialização do servidor local, configuração do modelo do Gateway,
necessidades de preparação do perfil de autenticação e flags de capacidade ativa/simulada. O código compartilhado da suíte e
do Gateway é roteado pelo registro de provedores, em vez de criar ramificações com base nos
nomes dos provedores.

## Adaptadores de transporte

O `qa-lab` é responsável por uma interface genérica de transporte para cenários de QA em YAML. `qa-channel` é
o padrão sintético. `crabline` inicia servidores locais com formato de provedor e
executa os Plugins de canal normais do OpenClaw neles. `live` é reservado para
credenciais reais de provedores e canais externos.

No nível da arquitetura, a divisão é:

- `qa-lab` é responsável pela execução genérica de cenários, concorrência de workers, gravação
  de artefatos e geração de relatórios.
- O adaptador de transporte é responsável pela configuração do Gateway, prontidão, observação de entrada e saída,
  ações de transporte e estado normalizado do transporte.
- Os arquivos de cenário YAML em `qa/scenarios/` definem a execução do teste; o `qa-lab`
  fornece a superfície reutilizável do runtime que os executa.

### Adição de um canal

Adicionar um canal ao sistema de QA em YAML requer a implementação do canal,
além de um pacote de cenários que exercite o contrato do canal. Para cobertura de smoke em CI,
adicione o servidor de provedor local correspondente do Crabline e exponha-o
pelo driver `crabline`.

Não adicione uma nova raiz de comando de QA de nível superior quando o host compartilhado `qa-lab` puder
ser responsável pelo fluxo.

O `qa-lab` é responsável pelos mecanismos compartilhados do host:

- a raiz de comando `openclaw qa`
- inicialização e encerramento da suíte
- concorrência de workers
- gravação de artefatos
- geração de relatórios
- execução de cenários
- aliases de compatibilidade para cenários `qa-channel` mais antigos

Os Plugins executores são responsáveis pelo contrato de transporte:

- como `openclaw qa <runner>` é montado sob a raiz compartilhada `qa`
- como o Gateway é configurado para esse transporte
- como a prontidão é verificada
- como eventos de entrada são injetados
- como mensagens de saída são observadas
- como transcrições e o estado normalizado do transporte são expostos
- como ações respaldadas pelo transporte são executadas
- como a redefinição ou limpeza específica do transporte é tratada

Os requisitos mínimos de adoção para um novo canal:

1. Manter `qa-lab` como proprietário da raiz compartilhada `qa`.
2. Implementar o executor do transporte no ponto de integração compartilhado do host `qa-lab`.
3. Manter a mecânica específica do transporte dentro do Plugin executor ou do
   ambiente de testes do canal.
4. Montar o executor como `openclaw qa <runner>` em vez de registrar um
   comando raiz concorrente. Os Plugins executores devem declarar `qaRunners` em
   `openclaw.plugin.json` e exportar um array `qaRunnerCliRegistrations`
   correspondente de `runtime-api.ts`. Manter `runtime-api.ts` leve; o carregamento
   tardio da CLI e a execução do executor devem permanecer atrás de pontos de entrada
   separados. Um `adapterFactory` opcional expõe o transporte a cenários
   compartilhados sem alterar o catálogo de cenários existente do comando.
5. Criar ou adaptar cenários YAML nos diretórios temáticos
   `qa/scenarios/`.
6. Usar os auxiliares genéricos de cenário para novos cenários.
7. Manter os aliases de compatibilidade existentes funcionando, a menos que o repositório
   esteja realizando uma migração intencional.

A regra de decisão é estrita:

- Se o comportamento puder ser expresso uma única vez em `qa-lab`, coloque-o em `qa-lab`.
- Se o comportamento depender do transporte de um canal, mantenha-o nesse Plugin
  executor ou no ambiente de testes do Plugin.
- Se um cenário precisar de um novo recurso que possa ser usado por mais de um canal,
  adicione um auxiliar genérico em vez de uma ramificação específica de canal em `suite.ts`.
- Se um comportamento só fizer sentido para um transporte, mantenha o cenário
  específico do transporte e deixe isso explícito no contrato do cenário.

### Nomes dos auxiliares de cenário

Auxiliares genéricos preferenciais para novos cenários:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Os aliases de compatibilidade continuam disponíveis para cenários existentes —
`waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`,
`formatConversationTranscript`, `resetBus` —, mas a criação de novos cenários
deve usar os nomes genéricos. Os aliases existem para evitar uma migração
de uma só vez, não como o modelo a ser seguido daqui em diante.

## Relatórios

`qa-lab` exporta um relatório de protocolo em Markdown com base na linha do tempo
observada do barramento. O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Quais cenários de acompanhamento vale a pena adicionar

Para consultar o inventário de cenários disponíveis — útil ao estimar o trabalho de acompanhamento
ou integrar um novo transporte — execute `pnpm openclaw qa coverage` (adicione `--json`
para obter uma saída legível por máquina). Ao escolher uma comprovação específica para um
comportamento ou caminho de arquivo alterado, execute `pnpm openclaw qa coverage --match <query>`. O
relatório de correspondências pesquisa metadados de cenários, referências de documentação, referências de código, IDs de cobertura,
plugins e requisitos de provedores e, em seguida, exibe os alvos `qa suite
--scenario ...` correspondentes.

Cada execução de `qa suite` grava os artefatos de nível superior `qa-evidence.json`,
`qa-suite-summary.json` e `qa-suite-report.md` para o conjunto de
cenários selecionado. Os cenários que declaram `execution.kind: vitest` ou
`execution.kind: playwright` executam o caminho de teste correspondente e também gravam
logs por cenário. Os cenários que declaram `execution.kind: script` executam o
produtor de evidências em `execution.path` por meio de `node --import tsx` (com
`${outputDir}` e `${scenarioId}` expandidos em `execution.args`); o
produtor grava seu próprio `qa-evidence.json`, cujas entradas são importadas para
a saída da suíte e cujos caminhos de artefatos são resolvidos em relação ao
`qa-evidence.json` desse produtor. Quando `qa suite` é acessado por meio de `qa run
--qa-profile`, o mesmo `qa-evidence.json` também inclui o resumo do
painel de pontuação do perfil para as categorias de taxonomia selecionadas.

Trate a saída de cobertura como um auxílio à descoberta, não como substituta de um gate; o
cenário selecionado ainda precisa do modo de provedor, transporte ativo,
Multipass, Testbox ou lane de lançamento adequados ao comportamento em teste. Para
obter o contexto do painel de pontuação, consulte [Painel de pontuação de maturidade](/pt-BR/maturity/scorecard).

Para verificações de personalidade e estilo, execute o mesmo cenário com várias
referências de modelos ativos e gere um relatório Markdown avaliado:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.6-luna,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.6-sol,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

O comando executa processos filhos locais do Gateway de QA, não Docker. Os cenários de
avaliação de personalidade devem definir a persona por meio de `SOUL.md` e, em seguida, executar
interações comuns do usuário, como conversas, ajuda com o workspace e pequenas tarefas com arquivos. O modelo
candidato não deve ser informado de que está sendo avaliado. O comando preserva
cada transcrição completa, registra estatísticas básicas da execução e, em seguida, solicita aos modelos avaliadores, no
modo rápido e com raciocínio `xhigh` quando compatível, que classifiquem as execuções por
naturalidade, estilo e humor. Use `--blind-judge-models` ao comparar
provedores: o prompt do avaliador ainda recebe todas as transcrições e os status das execuções, mas
as referências dos candidatos são substituídas por rótulos neutros, como `candidate-01`; o
relatório associa novamente as classificações às referências reais após o processamento.

As execuções dos candidatos usam por padrão o nível de raciocínio `high`, com `medium` para o GPT-5.6 Luna e
`xhigh` para referências de avaliação mais antigas da OpenAI que sejam compatíveis. Substitua a configuração de um
candidato específico diretamente com `--model provider/model,thinking=<level>`; as opções
diretas também aceitam `fast`, `no-fast` e `fast=<bool>`. `--thinking
<level>` ainda define um fallback global, e a forma antiga `--model-thinking
<provider/model=level>` é mantida para compatibilidade. As referências de candidatos da OpenAI
usam o modo rápido por padrão, permitindo o processamento prioritário quando o provedor
oferece suporte. Passe `--fast` somente quando quiser forçar a ativação do modo rápido para
todos os modelos candidatos. As durações dos candidatos e avaliadores são registradas no
relatório para análise de benchmark, mas os prompts dos avaliadores dizem explicitamente para não classificar
por velocidade. As execuções dos modelos candidatos e avaliadores usam, por padrão, concorrência 16.
Reduza `--concurrency` ou `--judge-concurrency` quando os limites do provedor ou a pressão sobre o
Gateway local tornarem uma execução excessivamente instável.

Quando nenhum `--model` de candidato é fornecido, a avaliação de personalidade usa por padrão
`openai/gpt-5.6-luna`, `openai/gpt-5.2`, `openai/gpt-5`,
`anthropic/claude-opus-4-8`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e `google/gemini-3.1-pro-preview`. Quando nenhum
`--judge-model` é fornecido, os avaliadores usam por padrão
`openai/gpt-5.6-sol,thinking=xhigh,fast` e
`anthropic/claude-opus-4-8,thinking=high`.

## Documentação relacionada

- [QA de Matrix](/pt-BR/concepts/qa-matrix)
- [Painel de pontuação de maturidade](/pt-BR/maturity/scorecard)
- [Pacote de benchmarks para agentes pessoais](/pt-BR/concepts/personal-agent-benchmark-pack)
- [Canal de QA](/pt-BR/channels/qa-channel)
- [Testes](/pt-BR/help/testing)
- [Painel](/pt-BR/web/dashboard)
