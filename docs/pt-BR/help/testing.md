---
read_when:
    - Executando testes localmente ou na CI
    - Adicionando testes de regressão para bugs de modelos/provedores
    - Depuração do comportamento do Gateway e do agente
summary: 'Kit de testes: suítes unitárias/e2e/ao vivo, executores Docker e o que cada teste abrange'
title: Testes
x-i18n:
    generated_at: "2026-07-11T23:59:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

O OpenClaw tem três suítes do Vitest (unitária/integração, e2e e live), além de
executores Docker. Esta página aborda o que cada suíte cobre, qual comando executar
para determinado fluxo de trabalho, como os testes live descobrem credenciais e como
adicionar regressões para bugs reais de provedores/modelos.

<Note>
A **pilha de QA (qa-lab, qa-channel e faixas de transporte live)** está documentada separadamente:

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) — arquitetura, superfície de comandos e criação de cenários.
- [QA em matriz](/pt-BR/concepts/qa-matrix) — referência para `pnpm openclaw qa matrix`.
- [Quadro de maturidade](/pt-BR/maturity/scorecard) — como as evidências de QA de versões fundamentam decisões de estabilidade e LTS.
- [Canal de QA](/pt-BR/channels/qa-channel) — o plugin de transporte sintético usado por cenários respaldados pelo repositório.

Esta página aborda as suítes de testes regulares e os executores Docker/Parallels. A seção [Executores específicos de QA](#qa-specific-runners) abaixo lista as invocações concretas de `qa` e remete às referências acima.
</Note>

## Início rápido

Na maioria dos dias:

- Verificação completa (esperada antes do push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina com recursos de sobra: `pnpm test:max`
- Ciclo direto do Vitest em modo de observação: `pnpm test:watch`
- O direcionamento direto a arquivos também encaminha caminhos de plugins/canais: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Ao iterar sobre uma única falha, prefira primeiro execuções direcionadas.
- Site de QA com suporte do Docker: `pnpm qa:lab:up`
- Faixa de QA com suporte de VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você alterar testes ou quiser confiança adicional:

- Relatório informativo de cobertura do V8: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

## Diretórios temporários de testes

Use os auxiliares compartilhados em `test/helpers/temp-dir.ts` para diretórios
temporários pertencentes aos testes, de modo que a propriedade fique explícita
e a limpeza permaneça no ciclo de vida do teste:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` intencionalmente não expõe nenhum
método de limpeza manual — o Vitest é responsável pela limpeza após cada teste.
Auxiliares anteriores de nível mais baixo (`makeTempDir`, `cleanupTempDirs`,
`createTempDirTracker`) ainda existem para testes que não foram migrados; evite
novos usos deles e novas chamadas diretas a `fs.mkdtemp*`, a menos que um teste
esteja verificando explicitamente o comportamento bruto de diretórios
temporários. Quando um diretório temporário direto for realmente necessário,
adicione um comentário de permissão auditável com uma justificativa:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` relata novas criações diretas de
diretórios temporários e novos usos manuais do auxiliar compartilhado nas
linhas adicionadas ao diff, sem bloquear os estilos de limpeza existentes. Ele
segue a mesma classificação de caminhos de teste que
`scripts/changed-lanes.mjs` e ignora a própria implementação do auxiliar
compartilhado. `check:changed` executa esse relatório para caminhos de teste
alterados como um sinal de CI somente de aviso (anotações de aviso do GitHub,
não falhas).

## Fluxos de trabalho live e Docker/Parallels

Ao depurar provedores/modelos reais (requer credenciais reais):

- Suíte live (modelos + sondagens de ferramentas/imagens do Gateway): `pnpm test:live`
- Direcione silenciosamente a um arquivo live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Relatórios de desempenho em tempo de execução: dispare `OpenClaw Performance` com
  `live_openai_candidate=true` para uma interação real de agente com `openai/gpt-5.6-luna` ou
  `deep_profile=true` para artefatos de CPU/heap/rastreamento do Kova. Execuções
  diárias agendadas publicam relatórios das faixas de provedor simulado,
  perfil detalhado e GPT-5.6 Luna em `openclaw/clawgrit-reports` por meio de uma
  tarefa publicadora separada que consome artefatos; autenticação ausente ou
  inválida do publicador faz com que execuções agendadas e com `profile=release`
  falhem. Disparos manuais que não sejam de versão mantêm os artefatos do GitHub
  e tratam a publicação de relatórios como recomendável, mas não obrigatória. O
  relatório do provedor simulado também inclui números de inicialização do
  Gateway no nível do código-fonte, memória, pressão de plugins, ciclo repetido
  de saudação de modelo falso e inicialização da CLI.
- Varredura live de modelos no Docker: `pnpm test:docker:live-models`
  - Cada modelo selecionado executa uma interação de texto e uma pequena
    sondagem semelhante à leitura de arquivo. Modelos cujos metadados anunciam
    entrada de `image` também executam uma pequena interação com imagem.
    Desative as sondagens adicionais com `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ao isolar falhas de provedores.
  - Cobertura de CI: tanto a execução diária `OpenClaw Scheduled Live And E2E Checks`
    quanto a execução manual `OpenClaw Release Checks` chamam o fluxo de trabalho
    reutilizável de live/E2E com `include_live_suites: true`, o que inclui tarefas
    da matriz de modelos live do Docker fragmentadas por provedor.
  - Para novas execuções direcionadas na CI, dispare `OpenClaw Live And E2E Checks (Reusable)`
    com `include_live_suites: true` e `live_models_only: true`.
  - Adicione novos segredos de provedores com sinal forte a
    `scripts/ci-hydrate-live-auth.sh`, a
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e aos respectivos
    chamadores agendados/de versão.
- Teste de fumaça de conversa vinculada nativa do Codex: `pnpm test:docker:live-codex-bind`
  - Executa uma faixa live do Docker pelo caminho do servidor de aplicativo
    do Codex, vincula uma DM sintética do Slack com `/codex bind`, exercita
    `/codex fast` e `/codex permissions` e, em seguida, verifica se uma resposta
    simples e um anexo de imagem são encaminhados pela vinculação nativa do
    plugin em vez do ACP.
- Teste de fumaça do harness do servidor de aplicativo Codex: `pnpm test:docker:live-codex-harness`
  - Executa interações do agente do Gateway por meio do harness do servidor de
    aplicativo Codex pertencente ao plugin, verifica `/codex status` e
    `/codex models` e, por padrão, exercita sondagens de imagem, Cron MCP,
    subagente e Guardian. Desative a sondagem de subagente com
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ao isolar outras falhas. Para
    uma verificação direcionada de subagente, desative as outras sondagens:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Isso encerra após a sondagem de subagente, a menos que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esteja definido.
- Teste de fumaça de instalação sob demanda do Codex: `pnpm test:docker:codex-on-demand`
  - Instala o tarball empacotado do OpenClaw no Docker, executa a integração
    inicial com a chave de API da OpenAI e verifica se o plugin Codex e a
    dependência `@openai/codex` foram baixados sob demanda para a raiz do
    projeto npm gerenciado.
- Teste de fumaça live da dependência de ferramenta de plugin: `pnpm test:docker:live-plugin-tool`
  - Empacota um plugin de fixture com uma dependência real de `slugify`,
    instala-o por meio de `npm-pack:`, verifica a dependência na raiz do
    projeto npm gerenciado e então solicita que um modelo live da OpenAI chame
    a ferramenta do plugin e retorne o slug oculto.
- Teste de fumaça do comando de resgate do Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Verificação opcional de redundância para a superfície de comandos de
    resgate do canal de mensagens. Exercita `/crestodian status`, enfileira uma
    alteração persistente de modelo, responde `/crestodian yes` e verifica o
    caminho de gravação de auditoria/configuração.
- Teste de fumaça da primeira execução do Crestodian no Docker: `pnpm test:docker:crestodian-first-run`
  - Começa com um diretório de estado vazio do OpenClaw e primeiro comprova que
    a CLI empacotada `openclaw crestodian` falha de forma segura sem inferência.
    Em seguida, testa e ativa um Claude falso por meio do módulo de ativação
    empacotado. Somente depois disso uma solicitação aproximada à CLI empacotada
    chega ao planejador e é resolvida como configuração tipada, seguida por
    operações únicas de modelo, agente, plugin do Discord e SecretRef. Valida
    as entradas de configuração e auditoria. Isso é evidência complementar de
    verificação/operação, não uma prova de integração inicial interativa nem
    de agente/ferramenta/aprovação do Crestodian. A mesma faixa é disponibilizada
    no QA Lab por `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Teste de fumaça de custo do Moonshot/Kimi: com `MOONSHOT_API_KEY` definido, execute
  `openclaw models list --provider moonshot --json` e depois execute um
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolado com `moonshot/kimi-k2.6`. Verifique se o JSON informa Moonshot/K2.6 e
  se a transcrição do assistente armazena `usage.cost` normalizado.

<Tip>
Quando você precisar apenas de um caso com falha, prefira restringir os testes live pelas variáveis de ambiente de lista de permissões descritas abaixo.
</Tip>

## Executores específicos de QA

Estes comandos ficam ao lado das principais suítes de testes quando você precisa do realismo do QA Lab.

A CI executa o QA Lab em fluxos de trabalho dedicados. A paridade agêntica fica
aninhada em `QA-Lab - All Lanes` e na validação de versão, não em um fluxo de
trabalho independente de PR. A validação abrangente deve usar
`Full Release Validation` com `rerun_group=qa-parity` ou o grupo de QA das
verificações de versão. As verificações de versão estável/padrão mantêm o soak
live/Docker exaustivo protegido por `run_release_soak=true`; o perfil `full`
força a ativação do soak. `QA-Lab - All Lanes` é executado todas as noites em
`main` e por disparo manual, com a faixa de paridade simulada, a faixa live do
Matrix, a faixa live do Telegram gerenciada pelo Convex e a faixa live do
Discord gerenciada pelo Convex como tarefas paralelas. A QA agendada e as
verificações de versão passam explicitamente `--profile fast` para o Matrix,
enquanto o padrão da CLI do Matrix e da entrada manual do fluxo de trabalho
permanece `all`; o disparo manual pode fragmentar `all` nas tarefas `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`. `OpenClaw Release Checks`
executa a paridade, além das faixas rápidas do Matrix e do Telegram, antes da
aprovação da versão, usando `mock-openai/gpt-5.6-luna` nas verificações de
transporte da versão para que permaneçam determinísticas e evitem a
inicialização normal do plugin do provedor. Esses Gateways de transporte live
desativam a busca de memória; o comportamento de memória continua coberto
pelas suítes de paridade de QA.

Os fragmentos de mídia live da versão completa usam
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que já contém
`ffmpeg` e `ffprobe`. Os fragmentos live de modelos/backends do Docker usam a
imagem compartilhada `ghcr.io/openclaw/openclaw-live-test:<sha>`, criada uma
vez para cada commit selecionado, e depois a obtêm com
`OPENCLAW_SKIP_DOCKER_BUILD=1` em vez de recriá-la dentro de cada fragmento.

- `pnpm openclaw qa suite`
  - Executa cenários de QA respaldados pelo repositório diretamente no host.
  - Grava os artefatos de nível superior `qa-evidence.json`, `qa-suite-summary.json` e
    `qa-suite-report.md` para o conjunto de cenários selecionado, incluindo
    seleções de cenários de fluxo misto, Vitest e Playwright.
  - Quando acionado por `pnpm openclaw qa run --qa-profile <profile>`, incorpora
    o scorecard do perfil de taxonomia selecionado no mesmo `qa-evidence.json`.
    `smoke-ci` grava evidências enxutas (`evidenceMode: "slim"`, sem
    `execution` por entrada). `release` abrange o recorte selecionado de prontidão
    para lançamento; `all` seleciona todas as categorias de maturidade ativas e
    destina-se a acionamentos explícitos do fluxo de trabalho QA Profile
    Evidence quando é necessário um artefato de scorecard completo.
  - Executa vários cenários selecionados em paralelo por padrão, com
    workers de Gateway isolados. `qa-channel` usa concorrência 4 por padrão
    (limitada pela quantidade de cenários selecionados). Use `--concurrency <count>`
    para ajustar a quantidade de workers ou `--concurrency 1` para a via serial
    anterior.
  - Encerra com código diferente de zero quando qualquer cenário falha. Use
    `--allow-failures` para gerar artefatos sem um código de saída de falha.
  - Compatível com os modos de provedor `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor de provedor local respaldado pelo AIMock para
    cobertura experimental de fixtures e simulação de protocolo, sem substituir
    a via `mock-openai`, que considera os cenários.
- `pnpm openclaw qa coverage --match <query>`
  - Pesquisa IDs e títulos de cenários, superfícies, IDs de cobertura, referências
    de documentação, referências de código, plugins e requisitos de provedor e,
    em seguida, exibe os alvos correspondentes da suíte.
  - Use isto antes de uma execução do QA Lab quando souber o comportamento ou
    caminho de arquivo alterado, mas não o menor cenário. Serve apenas como
    orientação — ainda escolha a comprovação simulada, em ambiente real,
    Multipass, Matrix ou de transporte com base no comportamento alterado.
- `pnpm test:plugins:kitchen-sink-live`
  - Executa a bateria do plugin Kitchen Sink em ambiente real da OpenAI por meio
    do QA Lab. Instala o pacote externo Kitchen Sink, verifica o inventário de
    superfícies do SDK de plugins, consulta `/healthz` e `/readyz`, registra
    evidências de CPU/RSS do Gateway, executa um turno em ambiente real da OpenAI
    e verifica diagnósticos adversariais. Exige autenticação da OpenAI em ambiente
    real, como `OPENAI_API_KEY`. Em sessões hidratadas do Testbox, carrega
    automaticamente o perfil de autenticação em ambiente real do Testbox quando
    o auxiliar `openclaw-testbox-env` está presente.
- `pnpm test:gateway:cpu-scenarios`
  - Executa o benchmark de inicialização do Gateway junto com um pequeno pacote
    de cenários simulados do QA Lab (`channel-chat-baseline`,
    `memory-failure-fallback`, `gateway-restart-inflight-run`) e grava um resumo
    combinado de observações de CPU em `.artifacts/gateway-cpu-scenarios/`.
  - Por padrão, sinaliza apenas observações prolongadas de CPU elevada
    (`--cpu-core-warn`, padrão `0.9`; `--hot-wall-warn-ms`, padrão `30000`),
    portanto, picos curtos de inicialização são registrados como métricas sem
    parecerem a regressão que mantém o Gateway sobrecarregado por vários minutos.
  - É executado com os artefatos compilados em `dist`; faça uma compilação
    primeiro quando o checkout ainda não tiver uma saída de runtime atualizada.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA em uma VM Linux descartável do Multipass,
    mantendo os mesmos sinalizadores de seleção de cenários e de provedor/modelo
    de `qa suite`.
  - Execuções em ambiente real encaminham as entradas de autenticação de QA
    utilizáveis pelo sistema convidado: chaves de provedor baseadas em variáveis
    de ambiente, o caminho da configuração do provedor em ambiente real de QA e
    `CODEX_HOME`, quando presente.
  - Os diretórios de saída devem permanecer dentro da raiz do repositório para
    que o sistema convidado possa gravar de volta pelo espaço de trabalho montado.
  - Grava o relatório e o resumo normais de QA, além dos logs do Multipass, em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA respaldado pelo Docker para trabalhos de QA no estilo
    operacional.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Cria um tarball npm a partir do checkout atual, instala-o globalmente no
    Docker, executa a integração não interativa com chave de API da OpenAI,
    configura o Telegram por padrão, verifica se o runtime do plugin empacotado
    é carregado sem reparo de dependências na inicialização, executa o doctor e
    executa um turno de agente local em um endpoint simulado da OpenAI.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para executar a mesma via de
    instalação do pacote com o Discord.
- `pnpm test:docker:session-runtime-context`
  - Executa um smoke test determinístico do aplicativo compilado no Docker para
    transcrições de contexto de runtime incorporado. Verifica se o contexto de
    runtime oculto do OpenClaw persiste como uma mensagem personalizada não
    exibida, em vez de vazar para o turno visível do usuário; em seguida, fornece
    um JSONL de sessão defeituosa afetada e verifica se
    `openclaw doctor --fix` o regrava no branch ativo com um backup.
- `pnpm test:docker:npm-telegram-live`
  - Instala um pacote candidato do OpenClaw no Docker, executa a integração do
    pacote instalado, configura o Telegram por meio da CLI instalada e reutiliza
    a via de QA do Telegram em ambiente real com esse pacote instalado como o
    Gateway do sistema em teste.
  - O wrapper monta apenas o código-fonte do harness `qa-lab` proveniente do
    checkout; o pacote instalado é responsável por `dist`,
    `openclaw/plugin-sdk` e pelo runtime dos plugins incluídos, portanto, a via
    não mistura plugins do checkout atual com o pacote em teste.
  - O padrão é `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; defina
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para testar um tarball local resolvido em vez
    de instalar pelo registro.
  - Por padrão, emite medições repetidas de RTT em `qa-evidence.json` com
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Substitua
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` ou
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` para ajustar a execução.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` aceita uma lista separada por vírgulas de
    IDs de verificações de QA do Telegram a serem amostradas; quando não
    definido, a verificação padrão compatível com RTT é
    `telegram-mentioned-message-reply`.
  - Usa as mesmas credenciais de ambiente do Telegram ou a mesma fonte de
    credenciais do Convex que `pnpm openclaw qa telegram`. Para automação de
    CI/lançamento, defina
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` junto com
    `OPENCLAW_QA_CONVEX_SITE_URL` e um segredo de função. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e um segredo de função do Convex estiverem
    presentes na CI, o wrapper do Docker selecionará o Convex automaticamente.
  - O wrapper valida no host as variáveis de ambiente de credenciais do Telegram
    ou do Convex antes do trabalho de compilação/instalação no Docker. Defina
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` somente ao depurar
    deliberadamente a configuração anterior às credenciais.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` substitui
    `OPENCLAW_QA_CREDENTIAL_ROLE`, compartilhada, apenas para esta via. Quando
    credenciais do Convex são selecionadas e nenhuma função está definida, o
    wrapper usa `ci` na CI e `maintainer` fora da CI.
  - O GitHub Actions disponibiliza esta via como o fluxo de trabalho manual para
    mantenedores `NPM Telegram Beta E2E`. Ele não é executado no merge. O fluxo
    de trabalho usa o ambiente `qa-live-shared` e concessões de credenciais de CI
    do Convex.
- O GitHub Actions também disponibiliza `Package Acceptance` para comprovação
  paralela do produto com um pacote candidato. Ele aceita uma referência Git,
  uma especificação npm publicada, uma URL HTTPS de tarball com SHA-256, uma
  política de URL confiável ou um artefato de tarball de outra execução
  (`source=ref|npm|url|trusted-url|artifact`), envia o
  `openclaw-current.tgz` normalizado como `package-under-test` e, em seguida,
  executa o agendador Docker E2E existente com os perfis de via `smoke`,
  `package`, `product`, `full` ou `custom`. Defina
  `telegram_mode=mock-openai` ou `live-frontier` para executar o fluxo de
  trabalho de QA do Telegram com o mesmo artefato `package-under-test`.
  - Comprovação do produto na versão beta mais recente:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- A comprovação por URL exata de tarball exige um resumo criptográfico e usa a
  política de segurança para URLs públicas:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Espelhos corporativos/privados de tarballs usam uma política explícita de
  fonte confiável:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` lê `.github/package-trusted-sources.json` a partir da
referência confiável do fluxo de trabalho e não aceita credenciais na URL nem
uma forma de contornar a rede privada por entrada do fluxo de trabalho. Se a
política nomeada declarar autenticação por bearer token, configure o segredo
fixo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- A comprovação por artefato baixa um artefato de tarball de outra execução do
  Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empacota e instala a compilação atual do OpenClaw no Docker, inicia o
    Gateway com a OpenAI configurada e, em seguida, habilita canais/plugins
    incluídos por meio de edições na configuração.
  - Verifica se a descoberta de configuração mantém ausentes os plugins
    baixáveis não configurados, se o primeiro reparo configurado do doctor
    instala explicitamente cada plugin baixável ausente e se uma segunda
    reinicialização não executa um reparo oculto de dependências.
  - Também instala uma versão de referência npm anterior conhecida, habilita o
    Telegram antes de executar `openclaw update --tag <candidate>` e verifica se
    o doctor pós-atualização do candidato remove resíduos de dependências de
    plugins legados sem um reparo pós-instalação realizado pelo harness.
- `pnpm test:parallels:npm-update`
  - Executa o smoke test nativo de atualização da instalação empacotada em
    sistemas convidados do Parallels. Cada plataforma selecionada primeiro
    instala o pacote de referência solicitado, depois executa o comando
    `openclaw update` instalado no mesmo sistema convidado e verifica a versão
    instalada, o status da atualização, a prontidão do Gateway e um turno de
    agente local.
  - Use `--platform macos`, `--platform windows` ou `--platform linux` durante
    a iteração em um único sistema convidado. Use `--json` para obter o caminho
    do artefato de resumo e o status de cada via.
  - A via da OpenAI usa `openai/gpt-5.6-luna` por padrão para a comprovação do
    turno de agente em ambiente real. Passe `--model <provider/model>` ou defina
    `OPENCLAW_PARALLELS_OPENAI_MODEL` para validar outro modelo da OpenAI.
  - Envolva execuções locais longas em um timeout do host para que travamentos
    do transporte do Parallels não consumam o restante da janela de testes:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - O script grava logs de vias aninhadas em
    `/tmp/openclaw-parallels-npm-update.*`. Inspecione `windows-update.log`,
    `macos-update.log` ou `linux-update.log` antes de presumir que o wrapper
    externo está travado.
  - A atualização do Windows pode levar de 10 a 15 minutos no doctor
    pós-atualização e no trabalho de atualização de pacotes em um sistema
    convidado inicializado a frio; isso ainda é normal quando o log de depuração
    npm aninhado continua avançando.
  - Não execute este wrapper agregado em paralelo com vias individuais de smoke
    test do Parallels para macOS, Windows ou Linux. Elas compartilham o estado
    das VMs e podem entrar em conflito na restauração de snapshots, no
    fornecimento de pacotes ou no estado do Gateway do sistema convidado.
  - A comprovação pós-atualização executa a superfície normal dos plugins
    incluídos porque fachadas de recursos, como fala, geração de imagens e
    compreensão de mídia, são carregadas pelas APIs de runtime incluídas, mesmo
    quando o próprio turno do agente verifica apenas uma resposta de texto
    simples.

- `pnpm openclaw qa aimock`
  - Inicia somente o servidor local do provedor AIMock para testes diretos de fumaça
    do protocolo.
- `pnpm openclaw qa matrix`
  - Executa a faixa de QA ao vivo do Matrix em um homeserver Tuwunel descartável
    baseado em Docker. Somente para checkout do código-fonte — instalações empacotadas não incluem
    `qa-lab`.
  - CLI completa, catálogo de perfis/cenários, variáveis de ambiente e estrutura de artefatos:
    [QA do Matrix](/pt-BR/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Executa a faixa de QA ao vivo do Telegram em um grupo privado real usando os
    tokens de bot do driver e do sistema em teste obtidos do ambiente.
  - Requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O ID do grupo deve ser o ID numérico
    do chat do Telegram.
  - Aceita `--credential-source convex` para credenciais compartilhadas em pool.
    Use o modo de ambiente por padrão ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`
    para optar por concessões do pool.
  - Os padrões abrangem canário, restrição por menção, endereçamento de comandos, `/status`,
    respostas mencionadas entre bots e respostas dos comandos nativos principais.
    Os padrões de `mock-openai` também abrangem regressões determinísticas da cadeia de respostas e
    do streaming da mensagem final do Telegram. Use `--list-scenarios`
    para sondagens opcionais, como `session_status`.
  - Encerra com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` para
    gerar artefatos sem um código de saída de falha.
  - Requer dois bots distintos no mesmo grupo privado, com o bot do sistema em teste
    expondo um nome de usuário do Telegram.
  - Para uma observação estável entre bots, habilite o modo de comunicação entre bots
    em `@BotFather` para ambos e garanta que o bot driver possa observar
    o tráfego dos bots no grupo.
  - Grava um relatório de QA do Telegram, um resumo e `qa-evidence.json` em
    `.artifacts/qa-e2e/...`. Os cenários com resposta incluem o RTT desde a solicitação de envio
    do driver até a resposta observada do sistema em teste.

`Mantis Telegram Live` é o wrapper de evidências de PR em torno dessa faixa. Ele executa
a referência candidata com credenciais do Telegram concedidas pelo Convex, renderiza o
conjunto de relatório/evidências de QA com dados sensíveis removidos em um navegador desktop do Crabbox, grava
evidências em MP4, gera um GIF aparado conforme o movimento, envia o conjunto de artefatos e
publica evidências embutidas no PR por meio do Mantis GitHub App quando `pr_number` está
definido. Os mantenedores podem iniciá-lo pela interface do Actions usando `Mantis Scenario`
(`scenario_id: telegram-live`) ou diretamente por um comentário em uma pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` é o wrapper agêntico nativo do Telegram Desktop
para a comprovação visual de PR antes/depois. Inicie-o pela interface do Actions com
`instructions` em formato livre, por meio de `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) ou por um comentário em um PR:

```text
@openclaw-mantis telegram desktop proof
```

O agente Mantis lê o PR, decide qual comportamento visível no Telegram comprova
a alteração, executa a faixa de comprovação do Telegram Desktop no Crabbox com usuário real nas
referências de base e candidata, repete até que os GIFs nativos sejam úteis,
grava um manifesto `motionPreview` pareado e publica a mesma tabela de GIFs
em duas colunas por meio do Mantis GitHub App quando `pr_number` está definido.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Obtém ou reutiliza um desktop Linux do Crabbox, instala o Telegram
    Desktop nativo, configura o OpenClaw com um token de bot do sistema em teste do Telegram concedido,
    inicia o Gateway e grava evidências em captura de tela/MP4 a partir do
    desktop VNC visível.
  - Usa `--credential-source convex` por padrão para que os fluxos de trabalho precisem apenas do
    segredo do agente intermediário do Convex. Use `--credential-source env` com as mesmas
    variáveis `OPENCLAW_QA_TELEGRAM_*` de `pnpm openclaw qa telegram`.
  - O Telegram Desktop ainda requer um login/perfil de usuário. O token do bot
    configura somente o OpenClaw. Use `--telegram-profile-archive-env <name>`
    para um arquivo de perfil `.tgz` em base64 ou use `--keep-lease` e faça login
    manualmente pelo VNC uma vez.
  - Grava `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` e `telegram-desktop-builder.mp4`
    no diretório de saída.

As faixas de transporte ao vivo compartilham um contrato padrão para que novos transportes não
divirjam; a matriz de cobertura por faixa está em
[Visão geral do QA — Cobertura de transportes ao vivo](/pt-BR/concepts/qa-e2e-automation#live-transport-coverage).
`qa-channel` é o conjunto sintético abrangente e não faz parte dessa matriz.

### Credenciais compartilhadas do Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
está habilitado para QA de transporte ao vivo, o laboratório de QA adquire uma concessão exclusiva de um
pool baseado em Convex, envia Heartbeat para essa concessão enquanto a faixa está em execução e
libera a concessão no encerramento. O nome da seção é anterior ao suporte a Discord, Slack e
WhatsApp; o contrato de concessão é compartilhado entre os tipos.

Estrutura de referência do projeto Convex: `qa/convex-credential-broker/`

Variáveis de ambiente obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo, `https://your-deployment.convex.site`)
- Um segredo para a função selecionada:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção da função da credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão do ambiente: `OPENCLAW_QA_CREDENTIAL_ROLE` (o padrão é `ci` em CI e `maintainer` nos demais casos)

Variáveis de ambiente opcionais:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (padrão `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (padrão `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (padrão `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (padrão `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (padrão `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID de rastreamento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs `http://` local loopback do Convex somente para desenvolvimento local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` em operação normal.

Os comandos administrativos dos mantenedores (adicionar/remover/listar no pool) exigem
especificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Auxiliares de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `doctor` antes das execuções ao vivo para verificar a URL do site Convex, os segredos do agente intermediário,
o prefixo do endpoint, o tempo limite HTTP e o acesso administrativo/de listagem sem imprimir
os valores dos segredos. Use `--json` para uma saída legível por máquina em scripts e utilitários
de CI.

Contrato padrão do endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
As solicitações são autenticadas com um cabeçalho `Authorization: Bearer <role secret>`;
os corpos abaixo omitem esse cabeçalho:

- `POST /acquire`
  - Solicitação: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sucesso: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esgotado/repetível: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Solicitação: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Sucesso: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Solicitação: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Sucesso: `{ status: "ok" }` (ou `2xx` vazio)
- `POST /release`
  - Solicitação: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Sucesso: `{ status: "ok" }` (ou `2xx` vazio)
- `POST /admin/add` (somente segredo de mantenedor)
  - Solicitação: `{ kind, actorId, payload, note?, status? }`
  - Sucesso: `{ status: "ok", credential }`
- `POST /admin/remove` (somente segredo de mantenedor)
  - Solicitação: `{ credentialId, actorId }`
  - Sucesso: `{ status: "ok", changed, credential }`
  - Proteção contra concessão ativa: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (somente segredo de mantenedor)
  - Solicitação: `{ kind?, status?, includePayload?, limit? }`
  - Sucesso: `{ status: "ok", credentials, count }`

Formato da carga útil para o tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve ser uma string com o ID numérico do chat do Telegram.
- `admin/add` valida esse formato para `kind: "telegram"` e rejeita cargas úteis malformadas.

Formato da carga útil para o tipo de usuário real do Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` e `telegramApiId` devem ser strings numéricas.
- `tdlibArchiveSha256` e `desktopTdataArchiveSha256` devem ser strings hexadecimais SHA-256.
- `kind: "telegram-user"` é reservado para o fluxo de trabalho de comprovação do Mantis Telegram Desktop. As faixas genéricas do laboratório de QA não devem adquiri-lo.

Cargas úteis multicanal validadas pelo agente intermediário:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

As faixas do Slack também podem obter concessões do pool, mas a validação da carga útil do Slack
atualmente reside no executor de QA do Slack, e não no agente intermediário. Use
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
para as entradas do Slack.

### Adição de um canal ao QA

A arquitetura e os nomes dos auxiliares de cenário para novos adaptadores de canal estão em
[Visão geral do QA — Adição de um canal](/pt-BR/concepts/qa-e2e-automation#adding-a-channel).
Os requisitos mínimos são: implementar o executor de transporte na interface compartilhada do host `qa-lab`,
adicionar um `adapterFactory` para cenários compartilhados, declarar `qaRunners` no
manifesto do Plugin, montar como `openclaw qa <runner>` e criar cenários em
`qa/scenarios/`.

## Conjuntos de testes (o que é executado e onde)

Considere os conjuntos como de “realismo crescente” (e também de instabilidade/custo crescente).

### Unidade/integração (padrão)

- Comando: `pnpm test`
- Configuração: execuções sem alvo usam o conjunto de fragmentos `vitest.full-*.config.ts` e podem
  expandir fragmentos com vários projetos em configurações por projeto para agendamento
  paralelo
- Arquivos: inventários de testes principais/unitários em `src/**/*.test.ts`,
  `packages/**/*.test.ts` e `test/**/*.test.ts`; os testes unitários da interface são executados no
  fragmento dedicado `unit-ui`
- Escopo:
  - Testes unitários puros
  - Testes de integração no processo (autenticação do Gateway, roteamento, ferramentas, análise sintática, configuração)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Executado em CI
  - Não requer chaves reais
  - Deve ser rápido e estável
  - Os testes do resolvedor e do carregador de superfícies públicas devem comprovar o comportamento amplo de fallback de `api.js` e
    `runtime-api.js` com pequenos fixtures gerados de Plugin,
    não com APIs reais do código-fonte de Plugins incluídos. Carregamentos reais de APIs de Plugins pertencem a
    conjuntos de contrato/integração mantidos pelo próprio Plugin.

Política de dependências nativas:

- Por padrão, as instalações de teste ignoram compilações nativas opcionais de opus do Discord. A
  voz do Discord usa o `libopus-wasm` incluído, e `@discordjs/opus` permanece desabilitado em
  `allowBuilds` para que os testes locais e as faixas do Testbox não compilem o
  complemento nativo.
- Compare o desempenho do opus nativo no repositório de benchmark do `libopus-wasm`, não
  nos ciclos padrão de instalação/teste do OpenClaw. Não defina `@discordjs/opus` como
  `true` no `allowBuilds` padrão; isso faz com que ciclos de instalação/teste não relacionados
  compilem código nativo.

<AccordionGroup>
  <Accordion title="Projetos, fragmentos e faixas com escopo">

    - Execuções não direcionadas de `pnpm test` usam treze configurações menores de shards (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um único processo nativo gigantesco do projeto raiz. Isso reduz o pico de RSS em máquinas sob carga e evita que o trabalho de resposta automática/Plugin deixe suítes não relacionadas sem recursos.
    - `pnpm test --watch` ainda usa o grafo de projetos nativo do `vitest.config.ts` raiz, pois um loop de observação com vários shards não é prático.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` encaminham primeiro os alvos explícitos de arquivo/diretório por lanes com escopo definido; assim, `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo de inicialização do projeto raiz completo.
    - Por padrão, `pnpm test:changed` expande os caminhos alterados no git em lanes econômicas com escopo definido: edições diretas de testes, arquivos `*.test.ts` irmãos, mapeamentos explícitos de código-fonte e dependentes locais no grafo de importação. Edições de configuração, preparação ou pacote não executam testes de forma ampla, a menos que você use explicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` é a barreira inteligente normal de verificações locais para trabalhos restritos. Ele classifica o diff entre núcleo, testes do núcleo, extensões, testes de extensões, aplicativos, documentação, metadados de lançamento, ferramentas do Docker ativo e ferramental; depois, executa os comandos correspondentes de verificação de tipos, lint e proteção. Ele não executa testes do Vitest; chame `pnpm test:changed` ou `pnpm test <target>` explicitamente para comprovação por testes. Alterações somente de versão nos metadados de lançamento executam verificações direcionadas de versão/configuração/dependências raiz, com uma proteção que rejeita alterações de pacote fora do campo de versão de nível superior.
    - Edições no harness ACP do Docker ativo executam verificações específicas: sintaxe de shell dos scripts de autenticação do Docker ativo e uma simulação do agendador do Docker ativo. Alterações em `package.json` são incluídas somente quando o diff está limitado a `scripts["test:docker:live-*"]`; edições de dependências, exportações, versões e outras superfícies do pacote continuam usando as proteções mais amplas.
    - Testes unitários com poucas importações em agentes, comandos, plugins, auxiliares de resposta automática, `plugin-sdk` e áreas semelhantes de utilitários puros são encaminhados pela lane `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos com estado ou uso intenso do runtime permanecem nas lanes existentes.
    - Arquivos selecionados de código-fonte de auxiliares de `plugin-sdk` e `commands` também mapeiam execuções no modo de alterações para testes irmãos explícitos nessas lanes leves, para que edições em auxiliares evitem executar novamente toda a suíte pesada desse diretório.
    - `auto-reply` tem grupos dedicados para auxiliares do núcleo no nível superior, testes de integração `reply.*` no nível superior e a subárvore `src/auto-reply/reply/**`. A CI subdivide ainda mais a subárvore de respostas em shards de execução de agentes, despacho e comandos/roteamento de estado, para que um único grupo com muitas importações não ocupe toda a cauda do Node.
    - A CI normal de PR/main ignora intencionalmente a varredura em lote dos plugins incorporados e o shard `agentic-plugins`, exclusivo de lançamento. A Validação Completa de Lançamento aciona o fluxo de trabalho filho separado `Plugin Prerelease` para essas suítes com uso intenso de plugins em candidatos a lançamento.

  </Accordion>

  <Accordion title="Cobertura do executor incorporado">

    - Ao alterar as entradas de descoberta de ferramentas de mensagem ou o contexto de runtime da Compaction, mantenha os dois níveis de cobertura.
    - Adicione regressões específicas de auxiliares para limites puros de roteamento e normalização.
    - Mantenha íntegras as suítes de integração do executor incorporado:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` e
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Essas suítes verificam se os IDs com escopo definido e o comportamento da Compaction ainda percorrem os caminhos reais de `run.ts` / `compact.ts`; testes somente de auxiliares não substituem adequadamente esses caminhos de integração.

  </Accordion>

  <Accordion title="Padrões de pool e isolamento do Vitest">

    - A configuração básica do Vitest usa `threads` por padrão.
    - A configuração compartilhada do Vitest fixa `isolate: false` e usa o executor não isolado nos projetos raiz e nas configurações e2e e ativas.
    - A lane da interface no projeto raiz mantém sua configuração e seu otimizador `jsdom`, mas também é executada no executor compartilhado não isolado.
    - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false` da configuração compartilhada do Vitest.
    - Por padrão, `scripts/run-vitest.mjs` adiciona `--no-maglev` aos processos Node filhos do Vitest para reduzir a rotatividade de compilação do V8 durante grandes execuções locais. Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar com o comportamento padrão do V8.
    - `scripts/run-vitest.mjs` encerra execuções explícitas do Vitest fora do modo de observação após 5 minutos sem saída em stdout ou stderr. Defina `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` para desativar o monitor em uma investigação intencionalmente silenciosa.

  </Accordion>

  <Accordion title="Iteração local rápida">

    - `pnpm changed:lanes` mostra quais lanes arquitetônicas um diff aciona.
    - O hook de pré-commit executa somente formatação. Ele adiciona novamente à área de preparação os arquivos formatados e não executa lint, verificação de tipos nem testes.
    - Execute `pnpm check:changed` explicitamente antes da entrega ou do push quando precisar da barreira inteligente de verificações locais.
    - Por padrão, `pnpm test:changed` é encaminhado por lanes econômicas com escopo definido. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando o agente decidir que uma edição de harness, configuração, pacote ou contrato realmente precisa de cobertura mais ampla do Vitest.
    - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento, apenas com um limite maior de workers.
    - O dimensionamento automático de workers locais é intencionalmente conservador e recua quando a média de carga do host já está alta, para que várias execuções simultâneas do Vitest causem menos impacto por padrão.
    - A configuração básica do Vitest marca os projetos/arquivos de configuração como `forceRerunTriggers`, para que as novas execuções no modo de alterações permaneçam corretas quando a estrutura dos testes mudar.
    - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado nos hosts compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` para indicar um local explícito de cache durante a criação direta de perfil.

  </Accordion>

  <Accordion title="Depuração de desempenho">

    - `pnpm test:perf:imports` habilita o relatório de duração das importações do Vitest e a saída detalhada das importações.
    - `pnpm test:perf:imports:changed` limita a mesma visualização de perfil aos arquivos alterados desde `origin/main`.
    - Os dados de tempo dos shards são gravados em `.artifacts/vitest-shard-timings.json`. Execuções da configuração inteira usam o caminho da configuração como chave; shards da CI com padrão de inclusão acrescentam o nome do shard, para que shards filtrados possam ser acompanhados separadamente.
    - Quando um teste crítico ainda passa a maior parte do tempo nas importações de inicialização, mantenha as dependências pesadas atrás de uma interface local restrita `*.runtime.ts` e simule essa interface diretamente, em vez de importar profundamente auxiliares de runtime apenas para repassá-los por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara o `test:changed` roteado com o caminho nativo do projeto raiz para esse diff confirmado e exibe o tempo decorrido e o RSS máximo no macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mede o desempenho da árvore de trabalho suja atual, encaminhando a lista de arquivos alterados por `scripts/test-projects.mjs` e pela configuração raiz do Vitest.
    - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para a sobrecarga de inicialização e transformação do Vitest/Vite.
    - `pnpm test:perf:profile:runner` grava perfis de CPU e heap do executor para a suíte unitária com o paralelismo de arquivos desativado.

  </Accordion>
</AccordionGroup>

### Estabilidade (Gateway)

- Comando: `pnpm test:stability:gateway`
- Configuração: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` e `test/vitest/vitest.infra.config.ts`, cada uma limitada a um worker
- Escopo:
  - Inicia um Gateway local loopback real com diagnósticos habilitados por padrão
  - Produz tráfego sintético de mensagens, memória e cargas grandes do Gateway pelo caminho de eventos de diagnóstico
  - Consulta `diagnostics.stability` pelo RPC WS do Gateway
  - Abrange auxiliares de persistência do pacote de estabilidade de diagnóstico
  - Verifica que o gravador permanece limitado, que as amostras sintéticas de RSS ficam abaixo do orçamento de pressão e que as profundidades das filas por sessão voltam a zero
- Expectativas:
  - Seguro para CI e sem necessidade de chaves
  - Lane restrita para acompanhamento de regressões de estabilidade, não um substituto para a suíte completa do Gateway

### E2E (agregado do repositório)

- Comando: `pnpm test:e2e`
- Escopo:
  - Executa a lane E2E de teste de fumaça do Gateway
  - Executa a lane E2E do navegador com simulação da Control UI
- Expectativas:
  - Seguro para CI e sem necessidade de chaves
  - Requer a instalação do Chromium do Playwright

### E2E (teste de fumaça do Gateway)

- Comando: `pnpm test:e2e:gateway`
- Configuração: `test/vitest/vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e testes E2E de plugins incorporados em `extensions/`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, em correspondência com o restante do repositório.
  - Usa workers adaptáveis (CI: até 2; local: 1 por padrão).
  - É executado em modo silencioso por padrão para reduzir a sobrecarga de E/S do console.
- Substituições úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a quantidade de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reativar a saída detalhada do console.
- Escopo:
  - Comportamento de ponta a ponta do Gateway com várias instâncias
  - Superfícies WebSocket/HTTP, pareamento de Nodes e operações de rede mais pesadas
- Expectativas:
  - É executado na CI (quando habilitado no pipeline)
  - Não requer chaves reais
  - Tem mais componentes envolvidos do que os testes unitários (pode ser mais lento)

### E2E (navegador simulado da Control UI)

- Comando: `pnpm test:ui:e2e`
- Configuração: `test/vitest/vitest.ui-e2e.config.ts`
- Arquivos: `ui/src/**/*.e2e.test.ts`
- Escopo:
  - Inicia a Control UI do Vite
  - Controla uma página real do Chromium por meio do Playwright
  - Substitui o WebSocket do Gateway por simulações determinísticas no navegador
- Expectativas:
  - É executado na CI como parte de `pnpm test:e2e`
  - Não requer um Gateway real, agentes ou chaves de provedores
  - A dependência do navegador deve estar presente (`pnpm --dir ui exec playwright install chromium`)

### E2E: teste de fumaça do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `extensions/openshell/src/backend.e2e.test.ts`
- Escopo:
  - Reutiliza um Gateway OpenShell local ativo
  - Cria um sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw usando `sandbox ssh-config` + execução SSH reais
  - Verifica o comportamento do sistema de arquivos canônico remoto por meio da ponte de sistema de arquivos do sandbox
- Expectativas:
  - Somente opcional; não faz parte da execução padrão de `pnpm test:e2e`
  - Requer uma CLI `openshell` local e um daemon do Docker funcional
  - Requer um Gateway OpenShell local ativo e sua origem de configuração
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados e depois destrói o sandbox de teste
- Substituições úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário da CLI fora do padrão ou um script wrapper
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` para expor a configuração registrada do Gateway ao teste isolado
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` para substituir o IP do Gateway do Docker usado pelo fixture de política do host

### Ativo (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `test/vitest/vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e testes em ambiente real de plugins integrados em `extensions/`
- Padrão: **ativado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - "Este provedor/modelo realmente funciona _hoje_ com credenciais reais?"
  - Detectar alterações de formato do provedor, peculiaridades de chamadas de ferramentas, problemas de autenticação e comportamento dos limites de taxa
- Expectativas:
  - Não é estável em CI por definição (redes reais, políticas reais dos provedores, cotas, indisponibilidades)
  - Gera custos / consome limites de taxa
  - Prefira executar subconjuntos restritos em vez de "tudo"
- As execuções em ambiente real usam chaves de API já exportadas e perfis de autenticação preparados.
- Por padrão, as execuções em ambiente real ainda isolam `HOME` e copiam o material de configuração/autenticação para um diretório inicial temporário de testes, para que os fixtures de unidade não possam modificar seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` somente quando precisar intencionalmente que os testes em ambiente real usem seu diretório inicial real.
- `pnpm test:live` usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...` e silencia os logs de inicialização do Gateway e as mensagens do Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser recuperar os logs completos de inicialização.
- Rotação de chaves de API (específica do provedor): defina `*_API_KEYS` no formato separado por vírgulas/pontos e vírgulas ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`), ou faça uma substituição específica por execução em ambiente real por meio de `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente quando recebem respostas de limite de taxa.
- Saída de progresso/Heartbeat:
  - As suítes em ambiente real emitem linhas de progresso para stderr, para que chamadas longas aos provedores permaneçam visivelmente ativas mesmo quando a captura do console pelo Vitest estiver silenciosa.
  - `test/vitest/vitest.live.config.ts` desativa a interceptação do console pelo Vitest, para que as linhas de progresso do provedor/Gateway sejam transmitidas imediatamente durante as execuções em ambiente real.
  - Ajuste os Heartbeats dos modelos diretos com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste os Heartbeats do Gateway/das sondagens com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Ao editar lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se tiver alterado muita coisa)
- Ao modificar a rede do Gateway / o protocolo WS / o pareamento: adicione `pnpm test:e2e`
- Ao depurar "meu bot está fora do ar" / falhas específicas do provedor / chamadas de ferramentas: execute um `pnpm test:live` restrito

## Testes em ambiente real (com acesso à rede)

Para a matriz de modelos em ambiente real, verificações rápidas dos backends de CLI, verificações rápidas de ACP, harness do servidor de aplicativo Codex e todos os testes em ambiente real de provedores de mídia (Deepgram, BytePlus, ComfyUI, imagem, música, vídeo e harness de mídia), além do tratamento de credenciais para execuções em ambiente real:

- consulte [Testes de suítes em ambiente real](/pt-BR/help/testing-live). Para a lista de verificação dedicada de atualização e
  validação de plugins, consulte
  [Testes de atualizações e plugins](/pt-BR/help/testing-updates-plugins).

## Executores Docker (verificações opcionais de "funciona no Linux")

Estes executores Docker são divididos em duas categorias:

- Executores de modelos em ambiente real: `test:docker:live-models` e `test:docker:live-gateway` executam apenas o arquivo em ambiente real correspondente à chave de perfil dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório local de configuração, workspace e arquivo opcional de ambiente do perfil. Os pontos de entrada locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Os executores Docker em ambiente real mantêm seus próprios limites práticos quando necessário:
  `test:docker:live-models` usa por padrão o conjunto selecionado de alta relevância com suporte, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Defina `OPENCLAW_LIVE_MAX_MODELS`
  ou as variáveis de ambiente do Gateway quando quiser explicitamente um limite menor ou uma varredura maior.
- `test:docker:all` cria a imagem Docker para ambiente real uma única vez por meio de `test:docker:live-build`, empacota o OpenClaw uma única vez como um tarball npm por meio de `scripts/package-openclaw-for-docker.mjs` e então cria/reutiliza duas imagens de `scripts/e2e/Dockerfile`. A imagem básica é apenas o executor Node/Git para as faixas de instalação/atualização/dependências de plugins; essas faixas montam o tarball pré-criado. A imagem funcional instala o mesmo tarball em `/app` para as faixas de funcionalidade do aplicativo compilado. As definições das faixas Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`; a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` executa o plano selecionado. O agregador usa um agendador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla os slots de processos, enquanto os limites de recursos impedem que faixas pesadas de ambiente real, instalação npm e vários serviços sejam iniciadas todas ao mesmo tempo. Se uma única faixa for mais pesada que os limites ativos, o agendador ainda poderá iniciá-la quando o conjunto estiver vazio e então a manterá em execução isoladamente até que haja capacidade disponível novamente. Os padrões são 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajuste `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (e outras substituições `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`) somente quando o host Docker tiver mais capacidade disponível. O executor realiza uma verificação preliminar do Docker por padrão, remove contêineres E2E obsoletos do OpenClaw, exibe o status a cada 30 segundos, armazena os tempos das faixas bem-sucedidas em `.artifacts/docker-tests/lane-timings.json` e usa esses tempos para iniciar primeiro as faixas mais longas nas execuções posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para exibir o manifesto ponderado das faixas sem criar nem executar o Docker, ou `node scripts/test-docker-all.mjs --plan-json` para exibir o plano de CI das faixas selecionadas, as necessidades de pacote/imagem e as credenciais.
- `Package Acceptance` é a verificação de pacote nativa do GitHub para "este tarball instalável funciona como produto?". Ela resolve um pacote candidato de `source=npm`, `source=ref`, `source=url`, `source=trusted-url` ou `source=artifact`, envia-o como `package-under-test` e então executa as faixas reutilizáveis de E2E em Docker com esse tarball exato, em vez de reempacotar a referência selecionada. Os perfis são ordenados por abrangência: `smoke`, `package`, `product` e `full` (além de `custom` para uma lista explícita de faixas). Consulte [Testes de atualizações e plugins](/pt-BR/help/testing-updates-plugins) para ver o contrato de pacotes/atualizações/plugins, a matriz de sobrevivência a atualizações publicadas, os padrões de lançamento e a triagem de falhas.
- As verificações de compilação e lançamento executam `scripts/check-cli-bootstrap-imports.mjs` após o tsdown. A proteção percorre o grafo compilado estático a partir de `dist/entry.js` e `dist/cli/run-main.js` e falha se esse grafo de inicialização anterior ao despacho importar estaticamente qualquer pacote externo (Commander, interface de prompts, undici, registro de logs e dependências semelhantes que tornam a inicialização pesada também contam) antes do despacho do comando; ela também limita o fragmento compilado de execução do Gateway a 70 KB e rejeita importações estáticas de caminhos frios conhecidos do Gateway (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`) a partir desse fragmento. Separadamente, `scripts/release-check.ts` executa verificações rápidas na CLI empacotada com `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` e `models list --provider openai`.
- A compatibilidade legada de Package Acceptance é limitada a `2026.4.25` (incluindo `2026.4.25-beta.*`). Até esse limite, o harness tolera apenas lacunas de metadados dos pacotes lançados: entradas omitidas do inventário privado de QA, ausência de `gateway install --wrapper`, arquivos de patch ausentes no fixture Git derivado do tarball, ausência de `update.channel` persistido, locais legados dos registros de instalação de plugins, ausência de persistência dos registros de instalação do marketplace e migração dos metadados de configuração durante `plugins update`. Para pacotes posteriores a `2026.4.25`, esses caminhos geram falhas estritas.
- Executores de verificação rápida em contêineres: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` e `test:docker:config-reload` inicializam um ou mais contêineres reais e verificam caminhos de integração de nível mais alto.
- As faixas E2E de Docker/Bash que instalam o tarball empacotado do OpenClaw por meio de `scripts/lib/openclaw-e2e-instance.sh` limitam o `npm install` a `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (padrão `600s`; defina `0` para desativar o wrapper durante a depuração).

Os executores Docker de modelos em ambiente real também montam por vinculação apenas os diretórios iniciais de autenticação de CLI necessários
(ou todos os compatíveis quando a execução não está restrita) e depois os copiam para o
diretório inicial do contêiner antes da execução, para que o OAuth de CLIs externas possa renovar tokens
sem modificar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Verificação rápida de vinculação ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; abrange Claude, Codex e Gemini por padrão, com cobertura estrita de Droid/OpenCode por meio de `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Verificação rápida do backend de CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Verificação rápida do harness do servidor de aplicativo Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desenvolvimento: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Verificações rápidas de observabilidade: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` e `pnpm qa:observability:smoke` são faixas privadas de QA executadas a partir do checkout do código-fonte. Intencionalmente, elas não fazem parte das faixas de lançamento de pacotes em Docker porque o tarball npm omite o QA Lab.
- Verificação rápida do Open WebUI em ambiente real: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de integração inicial (TTY, estruturação completa): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Verificação rápida de integração inicial/canal/agente com tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente o tarball empacotado do OpenClaw no Docker, configura o OpenAI por meio da integração inicial com referência de variável de ambiente e também o Telegram por padrão, executa o doctor e executa uma interação simulada com um agente OpenAI. Reutilize um tarball pré-criado com `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignore a recompilação no host com `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ou altere o canal com `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ou `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke da jornada do usuário da versão: `pnpm test:docker:release-user-journey` instala globalmente o tarball empacotado do OpenClaw em um diretório inicial limpo no Docker, executa a integração inicial, configura um provedor OpenAI simulado, executa um turno de agente, instala/desinstala plugins externos, configura o ClickClack com um fixture local, verifica mensagens de saída/entrada, reinicia o Gateway e executa o doctor.
- Smoke da integração inicial tipada da versão: `pnpm test:docker:release-typed-onboarding` instala o tarball empacotado, conduz `openclaw onboard` por um TTY real, configura a OpenAI como um provedor com referência a variável de ambiente, verifica que nenhuma chave bruta seja persistida e executa um turno de agente simulado.
- Smoke de mídia/memória da versão: `pnpm test:docker:release-media-memory` instala o tarball empacotado, verifica a compreensão de imagens a partir de um anexo PNG, a saída de geração de imagens compatível com OpenAI, a recuperação da busca na memória e a preservação dessa recuperação após a reinicialização do Gateway.
- Smoke da jornada de atualização do usuário da versão: `pnpm test:docker:release-upgrade-user-journey` instala, por padrão, a versão-base publicada mais recente anterior ao tarball candidato, configura o estado de provedor/plugin/ClickClack no pacote publicado, atualiza para o tarball candidato e então executa novamente a jornada principal de agente/plugin/canal. Se não existir uma versão-base publicada anterior, reutiliza a versão candidata. Substitua a versão-base com `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke do marketplace de plugins da versão: `pnpm test:docker:release-plugin-marketplace` instala a partir de um marketplace de fixture local, atualiza o plugin instalado, desinstala-o e verifica que a CLI do plugin desapareça e que os metadados de instalação sejam removidos.
- Smoke de instalação de Skill: `pnpm test:docker:skill-install` instala globalmente o tarball empacotado do OpenClaw no Docker, desabilita nas configurações as instalações de arquivos enviados, resolve pela busca o slug atual de uma Skill ativa no ClawHub, instala-a com `openclaw skills install` e verifica a Skill instalada, além dos metadados de origem/bloqueio em `.clawhub`.
- Smoke de troca do canal de atualização: `pnpm test:docker:update-channel-switch` instala globalmente o tarball empacotado do OpenClaw no Docker, troca do pacote `stable` para o git `dev`, verifica o canal persistido e o funcionamento do plugin após a atualização, depois retorna ao pacote `stable` e verifica o status da atualização.
- Smoke de sobrevivência à atualização: `pnpm test:docker:upgrade-survivor` instala o tarball empacotado do OpenClaw sobre um fixture sujo de usuário antigo, com agentes, configuração de canal, listas de permissões de plugins, estado obsoleto de dependências de plugins e arquivos existentes de espaço de trabalho/sessão. Ele executa a atualização do pacote e o doctor não interativo sem chaves ativas de provedor ou canal, depois inicia um Gateway em local loopback e verifica a preservação da configuração/do estado, além dos limites de inicialização/status.
- Smoke publicado de sobrevivência à atualização: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` por padrão, cria arquivos realistas de um usuário existente, configura essa versão-base com uma receita de comandos incorporada, valida a configuração resultante, atualiza essa instalação publicada para o tarball candidato, executa o doctor não interativo, grava `.artifacts/upgrade-survivor/summary.json`, depois inicia um Gateway em local loopback e verifica as intenções configuradas, a preservação do estado, a inicialização, `/healthz`, `/readyz` e os limites de status RPC. Substitua uma versão-base com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, solicite ao agendador agregado que expanda versões-base locais exatas com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, e expanda fixtures moldados conforme problemas relatados com `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, como `reported-issues`; o conjunto de problemas relatados inclui `configured-plugin-installs` para o reparo automático da instalação de plugins externos do OpenClaw. A Aceitação de Pacotes expõe esses valores como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, resolve tokens de metaversão-base como `last-stable-4` ou `all-since-2026.4.23`, e a Validação Completa da Versão expande a verificação prolongada do pacote da versão para `last-stable-4 2026.4.23 2026.5.2 2026.4.15`, além de `reported-issues`.
- Smoke do contexto de execução da sessão: `pnpm test:docker:session-runtime-context` verifica a persistência oculta da transcrição do contexto de execução, além do reparo pelo doctor dos ramos duplicados afetados de reescrita de prompt.
- Smoke de instalação global com Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empacota a árvore atual, instala-a com `bun install -g` em um diretório inicial isolado e verifica que `openclaw infer image providers --json` retorne os provedores de imagem incluídos em vez de ficar travado. Reutilize um tarball pré-compilado com `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignore a compilação no host com `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ou copie `dist/` de uma imagem Docker compilada com `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke do instalador no Docker: `bash scripts/test-install-sh-docker.sh` compartilha um cache npm entre seus contêineres raiz, de atualização e de npm direto. O smoke de atualização usa por padrão o `latest` do npm como versão-base estável antes de atualizar para o tarball candidato. Substitua-o localmente com `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ou, no GitHub, com a entrada `update_baseline_version` do fluxo de trabalho Install Smoke. As verificações do instalador sem privilégios de root mantêm um cache npm isolado para que entradas de cache pertencentes ao root não ocultem o comportamento da instalação local do usuário. Defina `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar o cache de raiz/atualização/npm direto entre reexecuções locais.
- A CI de Install Smoke ignora a atualização global duplicada por npm direto com `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; execute o script localmente sem essa variável de ambiente quando for necessária a cobertura direta de `npm install -g`.
- Smoke da CLI de exclusão de espaço de trabalho compartilhado por agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila por padrão a imagem do Dockerfile raiz, cria dois agentes com um espaço de trabalho em um diretório inicial isolado do contêiner, executa `agents delete --json` e verifica o JSON válido, além do comportamento de retenção do espaço de trabalho. Reutilize a imagem do smoke de instalação com `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Rede do Gateway e ciclo de vida do host: `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`) preserva o smoke de autenticação/integridade do WebSocket em LAN entre dois contêineres e depois usa HTTP administrativo em local loopback para comprovar o bloqueio durante a preparação, o acesso com controle retido, a recuperação por retomada e uma parada/inicialização preparada no mesmo contêiner. A verificação de reinicialização deve terminar antes que a concessão original expire, verifica que o estado de suspensão seja local ao processo enquanto a configuração persistida do Gateway e a identidade do contêiner sobrevivem, e emite JSON legível por máquina com a duração das fases.
- Smoke de snapshot CDP do navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila a imagem E2E do código-fonte e uma camada do Chromium, inicia o Chromium com CDP bruto, executa `browser doctor --deep` e verifica que os snapshots de funções CDP cubram URLs de links, elementos clicáveis promovidos pelo cursor, referências de iframe e metadados de quadros.
- Regressão de raciocínio mínimo de `web_search` no OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) executa um servidor OpenAI simulado por meio do Gateway, verifica que `web_search` eleve `reasoning.effort` de `minimal` para `low`, depois força a rejeição pelo esquema do provedor e verifica que os detalhes brutos apareçam nos logs do Gateway.
- Ponte MCP de canais (Gateway pré-configurado + ponte stdio + smoke de quadro bruto de notificação do Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Ferramentas MCP do pacote OpenClaw (servidor MCP stdio real + smoke de permissão/negação do perfil incorporado do OpenClaw): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Limpeza MCP de Cron/subagente (Gateway real + encerramento do processo-filho MCP stdio após execuções isoladas de Cron e execuções únicas de subagente): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalação/atualização para caminho local, `file:`, registro npm com dependências elevadas, metadados malformados de pacote npm, referências móveis do git, conjunto completo do ClawHub, atualizações do marketplace e habilitação/inspeção do pacote Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Defina `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para ignorar o bloco do ClawHub ou substitua o par padrão de pacote/execução do conjunto completo com `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sem `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, o teste usa um servidor hermético de fixture local do ClawHub.
- Smoke de atualização de plugin sem alterações: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke da matriz de ciclo de vida de plugins: `pnpm test:docker:plugin-lifecycle-matrix` instala o tarball empacotado do OpenClaw em um contêiner básico, instala um plugin npm, alterna entre habilitado/desabilitado, faz upgrade e downgrade por meio de um registro npm local, exclui o código instalado e então verifica que a desinstalação ainda remova o estado obsoleto enquanto registra métricas de RSS/CPU para cada fase do ciclo de vida.
- Smoke de metadados de recarregamento de configuração: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` cobre o smoke de instalação/atualização para caminho local, `file:`, registro npm com dependências elevadas, referências móveis do git, fixtures do ClawHub, atualizações do marketplace e habilitação/inspeção do pacote Claude. `pnpm test:docker:plugin-update` cobre o comportamento de atualização sem alterações para plugins instalados. `pnpm test:docker:plugin-lifecycle-matrix` cobre instalação, habilitação, desabilitação, upgrade, downgrade e desinstalação com código ausente de plugins npm, com monitoramento de recursos.

Para pré-compilar e reutilizar manualmente a imagem funcional compartilhada:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Substituições de imagem específicas da suíte, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, ainda têm precedência quando definidas. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` aponta para uma imagem remota compartilhada, os scripts baixam essa imagem se ela ainda não estiver disponível localmente. Os testes de QR e do instalador no Docker mantêm seus próprios Dockerfiles porque validam o comportamento de pacote/instalação, e não o ambiente de execução compartilhado do aplicativo compilado.

Os executores Docker com modelos ativos também montam o checkout atual como somente leitura
e o preparam em um diretório de trabalho temporário dentro do contêiner. Isso mantém a
imagem do ambiente de execução enxuta, ao mesmo tempo que executa o Vitest com seu código-fonte/configuração
local exato. A etapa de preparação ignora caches grandes que existem somente localmente e saídas
de compilação de aplicativos, como `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e
diretórios locais do aplicativo com saídas `.build` ou do Gradle, para que execuções ativas no Docker não
gastem minutos copiando artefatos específicos da máquina. Elas também definem
`OPENCLAW_SKIP_CHANNELS=1` para que as sondagens ativas do Gateway não iniciem processos reais
de canais do Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`; portanto, encaminhe também
`OPENCLAW_LIVE_GATEWAY_*` quando precisar restringir ou excluir a cobertura ativa do Gateway
dessa faixa do Docker.

`test:docker:openwebui` é um smoke test de compatibilidade de nível mais alto: ele inicia um
contêiner do Gateway do OpenClaw com os endpoints HTTP compatíveis com OpenAI habilitados,
inicia um contêiner fixado do Open WebUI apontando para esse Gateway, entra no
Open WebUI, verifica se `/api/models` expõe `openclaw/default` e, em seguida, envia uma
solicitação real de chat pelo proxy `/api/chat/completions` do Open WebUI. Defina
`OPENWEBUI_SMOKE_MODE=models` para verificações de CI do fluxo de lançamento que devem parar
após a entrada no Open WebUI e a descoberta do modelo, sem aguardar uma conclusão de modelo
ao vivo. A primeira execução pode ser consideravelmente mais lenta porque o Docker pode precisar
baixar a imagem do Open WebUI, e o Open WebUI pode precisar concluir sua própria
configuração de inicialização a frio. Essa faixa requer uma chave de modelo ao vivo utilizável, fornecida pelo
ambiente do processo, por perfis de autenticação preparados ou por um
`OPENCLAW_PROFILE_FILE` explícito. Execuções bem-sucedidas imprimem uma pequena carga JSON como
`{ "ok": true, "model": "openclaw/default", ... }`.

`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real do Telegram, Discord ou iMessage. Ele inicializa um contêiner do Gateway
com dados pré-carregados, inicia um segundo contêiner que executa `openclaw mcp serve` e, em seguida,
verifica a descoberta de conversas roteadas, a leitura de transcrições, os metadados de anexos,
o comportamento da fila de eventos ao vivo, o roteamento de envios de saída e as notificações de
canal + permissão no estilo Claude pela ponte MCP stdio real. A
verificação de notificações inspeciona diretamente os frames brutos do MCP stdio para que o smoke test
valide o que a ponte realmente emite, não apenas o que um SDK de cliente específico
eventualmente expõe.

`test:docker:agent-bundle-mcp-tools` é determinístico e não precisa de uma
chave de modelo ao vivo. Ele compila a imagem Docker do repositório, inicia um servidor de
sondagem MCP stdio real dentro do contêiner, materializa esse servidor por meio do
runtime MCP do pacote OpenClaw incorporado, executa a ferramenta e, em seguida, verifica se
`coding` e `messaging` mantêm as ferramentas `bundle-mcp`, enquanto `minimal` e
`tools.deny: ["bundle-mcp"]` as filtram.

`test:docker:cron-mcp-cleanup` é determinístico e não precisa de uma chave de
modelo ao vivo. Ele inicia um Gateway com dados pré-carregados e um servidor de sondagem MCP stdio real,
executa um turno isolado do Cron e um turno filho de execução única de `sessions_spawn` e, em seguida,
verifica se o processo filho MCP é encerrado após cada execução.

Smoke test manual de thread ACP em linguagem natural (fora da CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de trabalho de regressão/depuração. Ele pode ser necessário novamente para validar o roteamento de threads ACP, portanto, não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` montado e carregado antes da execução dos testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar somente as variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de configuração/espaço de trabalho e nenhuma montagem externa de autenticação da CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`, a menos que a execução já use um diretório de vínculo gerenciado/de CI) montado em `/home/node/.npm-global` para instalações em cache da CLI dentro do Docker
- Diretórios/arquivos externos de autenticação da CLI em `$HOME` são montados como somente leitura em `/host-auth...` e, em seguida, copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão (usados quando a execução não está limitada a provedores específicos): `.factory`, `.gemini`, `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções limitadas por provedor montam somente os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Substitua manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para limitar a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em novas execuções que não precisem de uma nova compilação
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do armazenamento de perfis (não do ambiente)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo Gateway para o smoke test do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação de nonce usado pelo smoke test do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag fixada da imagem do Open WebUI

## Verificação básica da documentação

Execute as verificações da documentação após editar documentos: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando também precisar verificar títulos dentro da página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões do "pipeline real" sem provedores reais:

- Chamada de ferramentas pelo Gateway (OpenAI simulado, Gateway real + loop do agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do Gateway (`wizard.start`/`wizard.next` via WS, grava a configuração + autenticação obrigatória): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Avaliações de confiabilidade do agente (Skills)

Já temos alguns testes seguros para CI que se comportam como "avaliações de confiabilidade do agente":

- Chamada de ferramentas simulada pelo Gateway real + loop do agente (`src/gateway/gateway.test.ts`).
- Fluxos completos do assistente que validam a conexão da sessão e os efeitos da configuração (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (consulte [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills são listadas no prompt, o agente escolhe a Skill correta (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes do uso e segue as etapas/argumentos obrigatórios?
- **Contratos de fluxo de trabalho:** cenários de vários turnos que verificam a ordem das ferramentas, a continuidade do histórico da sessão e os limites do sandbox.

As avaliações futuras devem priorizar o determinismo:

- Um executor de cenários que use provedores simulados para verificar chamadas de ferramentas + ordem, leituras de arquivos de Skills e conexão da sessão.
- Um pequeno conjunto de cenários voltados a Skills (usar ou evitar, bloqueios, injeção de prompt).
- Avaliações ao vivo opcionais (adesão voluntária, condicionadas por variáveis de ambiente) somente após a implementação do conjunto seguro para CI.

## Testes de contrato (formato de plugins e canais)

Os testes de contrato verificam se cada plugin e canal registrado está em conformidade com
seu contrato de interface. Eles percorrem todos os plugins descobertos e executam um
conjunto de asserções de formato e comportamento. A faixa de testes unitários padrão de `pnpm test`
ignora intencionalmente esses arquivos compartilhados de smoke test e de pontos de integração; execute os comandos de
contrato explicitamente ao alterar superfícies compartilhadas de canais ou provedores.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Somente contratos de canais: `pnpm test:contracts:channels`
- Somente contratos de provedores: `pnpm test:contracts:plugins`

### Contratos de canais

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`. Categorias atuais
de nível superior:

- **channel-catalog** - metadados das entradas do catálogo de canais incorporados/do registro
- **plugin** (baseado em registro, fragmentado) - formato básico de registro de plugins
- **surfaces-only** (baseado em registro, fragmentado) - verificações de formato por superfície para `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` e `gateway`
- **session-binding** (baseado em registro) - comportamento de vinculação de sessões
- **outbound-payload** - estrutura e normalização da carga de mensagens
- **group-policy** (fallback) - aplicação da política de grupo padrão por canal
- **threading** (baseado em registro, fragmentado) - tratamento de ids de threads
- **directory** (baseado em registro, fragmentado) - API de diretório/lista de membros
- **registry** e **plugins-core.\*** - componentes internos do registro de plugins de canais, carregador e autorização de gravação de configuração

Os auxiliares do harness para captura do despacho de entrada e carga de saída usados por esses
conjuntos são expostos internamente por `src/plugin-sdk/channel-contract-testing.ts`
(excluído do npm, não é um subcaminho público do SDK); não há um arquivo independente
`inbound.contract.test.ts` neste diretório.

### Contratos de provedores

Localizados em `src/plugins/contracts/*.contract.test.ts`. As categorias atuais
incluem:

- **shape** - formato do manifesto, da API e das exportações de runtime do plugin
- **plugin-registration** (+ paralelo) - casos de registro de manifesto
- **package-manifest** - requisitos do manifesto do pacote
- **loader** - comportamento de configuração/encerramento do carregador de plugins
- **registry** - conteúdo e consulta do registro de contratos de plugins
- **providers** - comportamento compartilhado entre provedores incorporados, além de provedores de pesquisa na web
- **auth-choice** - metadados de opções de autenticação e comportamento de configuração
- **provider-catalog-deprecation** - metadados obsoletos do catálogo de provedores
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options** - contratos do assistente de configuração de provedores
- **embedding-provider**, **memory-embedding-provider**, **web-fetch-provider**, **tts** - contratos de provedores específicos por recurso
- **session-actions**, **session-attachments**, **session-entry-projection** - contratos de estado de sessão pertencentes ao plugin
- **scheduled-turns** - metadados de turnos agendados do plugin e limites de carimbo de data/hora
- **host-hooks**, **run-context-lifecycle**, **runtime-import-side-effects**, **runtime-seams** - contratos de ciclo de vida do host/runtime do plugin e de limites de importação
- **extension-runtime-dependencies** - posicionamento das dependências de runtime para extensões

### Quando executar

- Após alterar exportações ou subcaminhos do SDK de plugins
- Após adicionar ou modificar um plugin de canal ou provedor
- Após refatorar o registro ou a descoberta de plugins

Os testes de contrato são executados na CI e não exigem chaves de API reais.

## Adição de regressões (orientações)

Ao corrigir um problema de provedor/modelo descoberto em execução ao vivo:

- Adicione uma regressão segura para CI, se possível (provedor simulado/stub ou captura da transformação exata do formato da solicitação)
- Se for algo inerentemente exclusivo de execução ao vivo (limites de taxa, políticas de autenticação), mantenha o teste ao vivo restrito e opcional por meio de variáveis de ambiente
- Prefira direcionar o teste à menor camada que detecte o bug:
  - bug na conversão/reprodução da solicitação do provedor -> teste direto de modelos
  - bug no pipeline de sessão/histórico/ferramentas do Gateway -> smoke test ao vivo do Gateway ou teste simulado do Gateway seguro para CI
- Proteção de travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um destino de amostra por classe de SecretRef dos metadados do registro (`listSecretTargetRegistryEntries()`) e, em seguida, verifica se ids de execução com segmentos de travessia são rejeitados.
  - Se você adicionar uma nova família de destinos SecretRef com `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de destino não classificados para impedir que novas classes sejam ignoradas silenciosamente.

## Relacionado

- [Testes ao vivo](/pt-BR/help/testing-live)
- [Testes de atualizações e plugins](/pt-BR/help/testing-updates-plugins)
- [CI](/pt-BR/ci)
