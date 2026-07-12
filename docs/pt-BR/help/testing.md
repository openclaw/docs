---
read_when:
    - Executando testes localmente ou na CI
    - Adição de testes de regressão para bugs de modelo/provedor
    - Depuração do comportamento do Gateway e do agente
summary: 'Kit de testes: suítes unitárias/e2e/em ambiente real, executores Docker e o que cada teste abrange'
title: Testes
x-i18n:
    generated_at: "2026-07-12T15:17:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

O OpenClaw tem três suítes do Vitest (unitária/integração, e2e, live), além de executores
Docker. Esta página aborda o que cada suíte cobre, qual comando executar para um
determinado fluxo de trabalho, como os testes live descobrem credenciais e como adicionar
regressões para bugs reais de provedores/modelos.

<Note>
A **pilha de QA (qa-lab, qa-channel, faixas de transporte live)** está documentada separadamente:

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) - arquitetura, superfície de comandos e criação de cenários.
- [QA do Matrix](/pt-BR/concepts/qa-matrix) - referência para `pnpm openclaw qa matrix`.
- [Tabela de maturidade](/pt-BR/maturity/scorecard) - como as evidências de QA de lançamentos fundamentam decisões de estabilidade e LTS.
- [Canal de QA](/pt-BR/channels/qa-channel) - o plugin de transporte sintético usado por cenários baseados no repositório.

Esta página aborda as suítes de testes regulares e os executores Docker/Parallels. A seção [Executores específicos de QA](#qa-specific-runners) abaixo lista as invocações concretas de `qa` e remete às referências acima.
</Note>

## Início rápido

Na maioria dos dias:

- Verificação completa (esperada antes do push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina com recursos de sobra: `pnpm test:max`
- Ciclo de observação direto do Vitest: `pnpm test:watch`
- O direcionamento direto a arquivos também encaminha caminhos de plugins/canais: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Ao iterar sobre uma única falha, prefira primeiro execuções direcionadas.
- Ambiente de QA baseado em Docker: `pnpm qa:lab:up`
- Faixa de QA baseada em VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você alterar testes ou quiser mais confiança:

- Relatório informativo de cobertura V8: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

## Diretórios temporários de testes

Use os auxiliares compartilhados em `test/helpers/temp-dir.ts` para diretórios
temporários pertencentes aos testes, para que a propriedade seja explícita e a limpeza
permaneça no ciclo de vida do teste:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("usa um espaço de trabalho temporário", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // usar o espaço de trabalho
});
```

`useAutoCleanupTempDirTracker(afterEach)` intencionalmente não expõe nenhum método
de limpeza manual — o Vitest controla a limpeza após cada teste. Auxiliares mais antigos
e de nível inferior (`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`) ainda existem
para testes que não foram migrados; evite novos usos deles e novas chamadas diretas a
`fs.mkdtemp*`, a menos que um teste esteja verificando explicitamente o comportamento
bruto de diretórios temporários. Quando um diretório temporário direto for realmente
necessário, adicione um comentário de permissão auditável com o motivo:

```ts
// openclaw-temp-dir: allow verifica o comportamento bruto de limpeza do fs
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` relata novas criações diretas de
diretórios temporários e novos usos manuais do auxiliar compartilhado nas linhas
adicionadas ao diff, sem bloquear os estilos de limpeza existentes. Ele segue a mesma
classificação de caminhos de teste que `scripts/changed-lanes.mjs` e ignora a própria
implementação do auxiliar compartilhado. `check:changed` executa esse relatório para
caminhos de teste alterados como um sinal de CI apenas de aviso (anotações de aviso do
GitHub, não falhas).

## Fluxos de trabalho live e Docker/Parallels

Ao depurar provedores/modelos reais (requer credenciais reais):

- Suíte live (modelos + sondagens de ferramentas/imagens do Gateway): `pnpm test:live`
- Direcione silenciosamente um arquivo live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Relatórios de desempenho do runtime: dispare `OpenClaw Performance` com
  `live_openai_candidate=true` para uma interação real do agente `openai/gpt-5.6-luna` ou
  `deep_profile=true` para artefatos de CPU/heap/rastreamento do Kova. As execuções diárias
  agendadas publicam relatórios das faixas de provedor simulado, perfil aprofundado e
  GPT-5.6 Luna em `openclaw/clawgrit-reports` por meio de um trabalho publicador separado
  que consome artefatos; autenticação ausente ou inválida do publicador faz falhar as
  execuções agendadas e as com `profile=release`. Disparos manuais que não são de lançamento
  mantêm os artefatos do GitHub e tratam a publicação dos relatórios como consultiva.
  O relatório do provedor simulado também inclui números de inicialização do Gateway no
  nível do código-fonte, memória, pressão de plugins, ciclos repetidos de saudação com
  modelo falso e inicialização da CLI.
- Varredura de modelos live no Docker: `pnpm test:docker:live-models`
  - Cada modelo selecionado executa uma interação de texto e uma pequena sondagem semelhante
    à leitura de arquivo. Modelos cujos metadados anunciam entrada de `image` também executam
    uma pequena interação com imagem. Desative as sondagens adicionais com
    `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ao isolar falhas
    de provedores.
  - Cobertura de CI: tanto o `OpenClaw Scheduled Live And E2E Checks` diário quanto o
    `OpenClaw Release Checks` manual chamam o fluxo de trabalho reutilizável live/E2E com
    `include_live_suites: true`, que inclui trabalhos de matriz de modelos live no Docker
    particionados por provedor.
  - Para novas execuções direcionadas no CI, dispare `OpenClaw Live And E2E Checks (Reusable)`
    com `include_live_suites: true` e `live_models_only: true`.
  - Adicione novos segredos de provedores com sinal elevado a `scripts/ci-hydrate-live-auth.sh`,
    além de `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e seus chamadores
    agendados/de lançamento.
- Teste rápido de chat vinculado nativo do Codex: `pnpm test:docker:live-codex-bind`
  - Executa uma faixa live no Docker pelo caminho do app-server do Codex, vincula uma
    DM sintética do Slack com `/codex bind`, exercita `/codex fast` e
    `/codex permissions` e, em seguida, verifica se uma resposta simples e um anexo de
    imagem são encaminhados pela vinculação nativa do plugin em vez do ACP.
- Teste rápido do harness do app-server do Codex: `pnpm test:docker:live-codex-harness`
  - Executa interações do agente do Gateway pelo harness do app-server do Codex pertencente
    ao plugin, verifica `/codex status` e `/codex models` e, por padrão, exercita sondagens
    de imagem, MCP do Cron, subagente e Guardian. Desative a sondagem do subagente com
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ao isolar outras falhas. Para uma
    verificação direcionada do subagente, desative as outras sondagens:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Isso encerra após a sondagem do subagente, a menos que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esteja definido.
- Teste rápido de instalação sob demanda do Codex: `pnpm test:docker:codex-on-demand`
  - Instala o tarball empacotado do OpenClaw no Docker, executa a configuração inicial
    com chave de API da OpenAI e verifica se o plugin Codex e a dependência `@openai/codex`
    foram baixados sob demanda para a raiz gerenciada do projeto npm.
- Teste rápido live de dependência de ferramenta de plugin: `pnpm test:docker:live-plugin-tool`
  - Empacota um plugin de fixture com uma dependência real de `slugify`, instala-o
    por meio de `npm-pack:`, verifica a dependência sob a raiz gerenciada do projeto npm
    e, em seguida, solicita que um modelo live da OpenAI chame a ferramenta do plugin e
    retorne o slug oculto.
- Teste rápido do comando de resgate do Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Verificação opcional com redundância adicional para a superfície do comando de resgate
    do canal de mensagens. Exercita `/crestodian status`, enfileira uma alteração persistente
    de modelo, responde `/crestodian yes` e verifica o caminho de gravação da auditoria/configuração.
- Teste rápido da primeira execução do Crestodian no Docker: `pnpm test:docker:crestodian-first-run`
  - Parte de um diretório de estado vazio do OpenClaw e primeiro comprova que a CLI
    `openclaw crestodian` empacotada falha de forma fechada sem inferência. Depois, testa
    e ativa um Claude falso por meio do módulo de ativação empacotado. Somente depois disso
    uma solicitação imprecisa à CLI empacotada chega ao planejador e é resolvida como uma
    configuração tipada, seguida por operações pontuais de modelo, agente, plugin do Discord
    e SecretRef. Ela valida entradas de configuração e auditoria. Isso fornece evidências
    complementares de verificação/operação, não uma prova de configuração inicial interativa
    nem de agente/ferramenta/aprovação do Crestodian. A mesma faixa é exposta no QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Teste rápido de custo do Moonshot/Kimi: com `MOONSHOT_API_KEY` definido, execute
  `openclaw models list --provider moonshot --json` e, em seguida, execute isoladamente
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  com `moonshot/kimi-k2.6`. Verifique se o JSON informa Moonshot/K2.6 e se a transcrição
  do assistente armazena `usage.cost` normalizado.

<Tip>
Quando você precisar apenas de um caso com falha, prefira restringir os testes live por meio das variáveis de ambiente de lista de permissões descritas abaixo.
</Tip>

## Executores específicos de QA

Estes comandos ficam ao lado das principais suítes de testes quando você precisa do realismo do QA Lab.

O CI executa o QA Lab em fluxos de trabalho dedicados. A paridade agêntica está incluída em
`QA-Lab - All Lanes` e na validação de lançamento, não em um fluxo de trabalho de PR
independente. A validação ampla deve usar `Full Release Validation` com
`rerun_group=qa-parity` ou o grupo de QA das verificações de lançamento. As verificações
de lançamento estáveis/padrão mantêm a carga exaustiva live/Docker condicionada a
`run_release_soak=true`; o perfil `full` força a ativação dessa carga. `QA-Lab - All Lanes`
é executado todas as noites em `main` e por disparo manual, com a faixa de paridade simulada,
a faixa live do Matrix, a faixa live do Telegram gerenciada pelo Convex e a faixa live do
Discord gerenciada pelo Convex como trabalhos paralelos. O QA agendado e as verificações
de lançamento passam explicitamente `--profile fast` ao Matrix, enquanto o padrão da CLI
do Matrix e da entrada manual do fluxo de trabalho permanece `all`; o disparo manual pode
particionar `all` nos trabalhos `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e
`e2ee-cli`. `OpenClaw Release Checks` executa a paridade, além das faixas rápidas do Matrix
e do Telegram, antes da aprovação do lançamento, usando `mock-openai/gpt-5.6-luna` nas
verificações de transporte do lançamento para que permaneçam determinísticas e evitem a
inicialização normal do plugin do provedor. Esses Gateways de transporte live desativam
a pesquisa de memória; o comportamento da memória continua coberto pelas suítes de
paridade de QA.

As partições live de mídia da validação completa do lançamento usam
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que já contém
`ffmpeg` e `ffprobe`. As partições de modelos/backends live no Docker usam a imagem
compartilhada `ghcr.io/openclaw/openclaw-live-test:<sha>`, compilada uma vez por commit
selecionado, e depois a obtêm com `OPENCLAW_SKIP_DOCKER_BUILD=1`, em vez de recompilá-la
dentro de cada partição.

- `pnpm openclaw qa suite`
  - Executa cenários de QA respaldados pelo repositório diretamente no host.
  - Grava os artefatos de nível superior `qa-evidence.json`, `qa-suite-summary.json` e
    `qa-suite-report.md` para o conjunto de cenários selecionado, incluindo
    seleções de cenários de fluxo misto, Vitest e Playwright.
  - Quando acionado por `pnpm openclaw qa run --qa-profile <profile>`, incorpora
    o scorecard do perfil de taxonomia selecionado no mesmo `qa-evidence.json`.
    `smoke-ci` grava evidências enxutas (`evidenceMode: "slim"`, sem
    `execution` por entrada). `release` abrange o recorte selecionado de preparação para lançamento; `all`
    seleciona todas as categorias de maturidade ativas e destina-se a acionamentos
    explícitos do fluxo de trabalho QA Profile Evidence quando é necessário um artefato de scorecard completo.
  - Executa vários cenários selecionados em paralelo por padrão, com
    workers isolados do Gateway. `qa-channel` usa concorrência 4 por padrão (limitada pela
    quantidade de cenários selecionados). Use `--concurrency <count>` para ajustar a quantidade de
    workers ou `--concurrency 1` para a faixa serial anterior.
  - Encerra com código diferente de zero quando algum cenário falha. Use `--allow-failures` para
    gerar artefatos sem um código de saída de falha.
  - Oferece suporte aos modos de provedor `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor de provedor local respaldado pelo AIMock para cobertura
    experimental de fixtures e mocks de protocolo, sem substituir a faixa
    `mock-openai`, que considera o cenário.
- `pnpm openclaw qa coverage --match <query>`
  - Pesquisa IDs e títulos de cenários, superfícies, IDs de cobertura, referências de documentação, referências
    de código, plugins e requisitos de provedor e, em seguida, imprime os alvos
    correspondentes da suíte.
  - Use isso antes de uma execução do QA Lab quando souber qual comportamento ou caminho de arquivo
    foi alterado, mas não qual é o menor cenário. Serve apenas como orientação — ainda é necessário escolher
    a prova de mock, ao vivo, Multipass, Matrix ou transporte com base no comportamento que está
    sendo alterado.
- `pnpm test:plugins:kitchen-sink-live`
  - Executa a bateria ao vivo do plugin OpenAI Kitchen Sink pelo QA Lab.
    Instala o pacote externo Kitchen Sink, verifica o inventário de superfícies do SDK
    de plugins, testa `/healthz` e `/readyz`, registra evidências de
    CPU/RSS do Gateway, executa um turno ao vivo do OpenAI e verifica diagnósticos
    adversariais. Requer autenticação ao vivo do OpenAI, como `OPENAI_API_KEY`. Em
    sessões hidratadas do Testbox, carrega automaticamente o perfil de autenticação
    ao vivo do Testbox quando o auxiliar `openclaw-testbox-env` está presente.
- `pnpm test:gateway:cpu-scenarios`
  - Executa o benchmark de inicialização do Gateway junto com um pequeno pacote de cenários simulados do QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e grava um resumo combinado das observações
    de CPU em `.artifacts/gateway-cpu-scenarios/`.
  - Por padrão, sinaliza apenas observações contínuas de CPU elevada (`--cpu-core-warn`,
    padrão `0.9`; `--hot-wall-warn-ms`, padrão `30000`), portanto picos breves de
    inicialização são registrados como métricas sem parecerem a regressão de
    saturação do Gateway que dura vários minutos.
  - Executa com base nos artefatos `dist` compilados; execute uma compilação primeiro quando o checkout
    ainda não tiver uma saída de runtime atualizada.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux Multipass descartável, mantendo
    os mesmos sinalizadores de seleção de cenários e de provedor/modelo de `qa suite`.
  - As execuções ao vivo encaminham as entradas de autenticação de QA viáveis para o sistema convidado:
    chaves de provedor baseadas em variáveis de ambiente, o caminho da configuração do provedor de QA ao vivo e
    `CODEX_HOME`, quando presente.
  - Os diretórios de saída devem permanecer sob a raiz do repositório para que o sistema convidado possa gravar de volta
    pelo workspace montado.
  - Grava o relatório e o resumo normais de QA, além dos logs do Multipass, em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA respaldado pelo Docker para trabalhos de QA no estilo de operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Compila um tarball npm a partir do checkout atual, instala-o globalmente no
    Docker, executa o onboarding não interativo com chave de API do OpenAI, configura
    o Telegram por padrão, verifica se o runtime do plugin empacotado é carregado sem
    reparo de dependências na inicialização, executa o doctor e executa um turno de agente local
    em um endpoint simulado do OpenAI.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para executar a mesma faixa de instalação
    empacotada com o Discord.
- `pnpm test:docker:session-runtime-context`
  - Executa um teste de fumaça determinístico da aplicação compilada no Docker para transcrições de contexto
    de runtime incorporado. Verifica se o contexto de runtime oculto do OpenClaw persiste como uma
    mensagem personalizada não exibida, em vez de vazar para o turno visível do usuário;
    em seguida, cria uma sessão JSONL quebrada afetada e verifica se
    `openclaw doctor --fix` a regrava no branch ativo com um backup.
- `pnpm test:docker:npm-telegram-live`
  - Instala um pacote candidato do OpenClaw no Docker, executa o onboarding do pacote
    instalado, configura o Telegram pela CLI instalada e, em seguida, reutiliza
    a faixa de QA ao vivo do Telegram com esse pacote instalado como o Gateway
    do sistema em teste.
  - O wrapper monta apenas o código-fonte do harness `qa-lab` a partir do checkout;
    o pacote instalado é responsável por `dist`, `openclaw/plugin-sdk` e pelo runtime
    dos plugins incluídos, portanto a faixa não mistura plugins do checkout atual no
    pacote em teste.
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
    IDs de verificações de QA do Telegram a serem amostrados; quando não definido, a verificação
    padrão compatível com RTT é `telegram-mentioned-message-reply`.
  - Usa as mesmas credenciais de ambiente do Telegram ou a mesma fonte de credenciais Convex que
    `pnpm openclaw qa telegram`. Para automação de CI/lançamento, defina
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` junto com
    `OPENCLAW_QA_CONVEX_SITE_URL` e um segredo de função. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e um segredo de função do Convex estiverem presentes na
    CI, o wrapper do Docker selecionará o Convex automaticamente.
  - O wrapper valida no host as variáveis de ambiente de credenciais do Telegram ou do Convex
    antes do trabalho de compilação/instalação no Docker. Defina
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` somente ao
    depurar deliberadamente a configuração anterior às credenciais.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` substitui
    `OPENCLAW_QA_CREDENTIAL_ROLE`, compartilhada, apenas para esta faixa. Quando as credenciais
    do Convex são selecionadas e nenhuma função está definida, o wrapper usa `ci` na CI
    e `maintainer` fora da CI.
  - O GitHub Actions disponibiliza esta faixa como o fluxo de trabalho manual de mantenedor
    `NPM Telegram Beta E2E`. Ele não é executado no merge. O fluxo de trabalho usa o
    ambiente `qa-live-shared` e concessões de credenciais de CI do Convex.
- O GitHub Actions também disponibiliza `Package Acceptance` para prova paralela do produto
  em relação a um pacote candidato. Ele aceita uma referência Git, uma especificação npm publicada,
  uma URL HTTPS de tarball acompanhada de SHA-256, uma política de URL confiável ou um artefato
  de tarball de outra execução (`source=ref|npm|url|trusted-url|artifact`), envia o
  `openclaw-current.tgz` normalizado como `package-under-test` e, em seguida, executa o
  agendador Docker E2E existente com os perfis de faixa `smoke`, `package`, `product`, `full`
  ou `custom`. Defina `telegram_mode=mock-openai` ou
  `live-frontier` para executar o fluxo de trabalho de QA do Telegram com o mesmo
  artefato `package-under-test`.
  - Prova mais recente do produto beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- A prova com URL exata do tarball requer um resumo criptográfico e usa a política de segurança para URLs públicas:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Espelhos de tarball empresariais/privados usam uma política explícita de fonte confiável:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` lê `.github/package-trusted-sources.json` a partir da referência confiável do fluxo de trabalho e não aceita credenciais na URL nem um desvio de rede privada fornecido como entrada do fluxo de trabalho. Se a política nomeada declarar autenticação por token bearer, configure o segredo fixo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- A prova por artefato baixa um artefato de tarball de outra execução do Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empacota e instala a compilação atual do OpenClaw no Docker, inicia o
    Gateway com o OpenAI configurado e, em seguida, habilita canais/plugins incluídos por meio de
    edições de configuração.
  - Verifica se a descoberta de configuração mantém ausentes os plugins baixáveis
    não configurados, se o primeiro reparo configurado do doctor instala explicitamente
    cada plugin baixável ausente e se uma segunda reinicialização não executa
    reparo oculto de dependências.
  - Também instala uma versão de referência npm mais antiga conhecida, habilita o Telegram antes de
    executar `openclaw update --tag <candidate>` e verifica se o
    doctor pós-atualização do candidato limpa resíduos de dependências legadas de plugins
    sem um reparo pós-instalação do lado do harness.
- `pnpm test:parallels:npm-update`
  - Executa o teste de fumaça nativo de atualização da instalação empacotada nos sistemas convidados do Parallels.
    Cada plataforma selecionada primeiro instala o pacote de referência solicitado,
    depois executa o comando `openclaw update` instalado no mesmo sistema convidado e
    verifica a versão instalada, o status da atualização, a prontidão do Gateway e
    um turno de agente local.
  - Use `--platform macos`, `--platform windows` ou `--platform linux`
    durante a iteração em um sistema convidado. Use `--json` para obter o caminho do artefato de resumo
    e o status por faixa.
  - A faixa do OpenAI usa `openai/gpt-5.6-luna` por padrão para a prova ao vivo de turno do agente.
    Passe `--model <provider/model>` ou defina
    `OPENCLAW_PARALLELS_OPENAI_MODEL` para validar outro modelo do OpenAI.
  - Envolva execuções locais longas em um limite de tempo do host para que travamentos do transporte
    do Parallels não consumam o restante da janela de testes:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - O script grava logs de faixas aninhadas em
    `/tmp/openclaw-parallels-npm-update.*`. Inspecione `windows-update.log`,
    `macos-update.log` ou `linux-update.log` antes de presumir que o wrapper
    externo está travado.
  - A atualização do Windows pode levar de 10 a 15 minutos no doctor pós-atualização e
    no trabalho de atualização do pacote em um sistema convidado frio; isso ainda é normal quando o
    log de depuração npm aninhado continua avançando.
  - Não execute este wrapper agregado em paralelo com faixas individuais de teste de fumaça
    do Parallels para macOS, Windows ou Linux. Elas compartilham o estado da VM e podem
    entrar em conflito na restauração de snapshots, na disponibilização de pacotes ou no estado do Gateway do sistema convidado.
  - A prova pós-atualização executa a superfície normal de plugins incluídos porque
    fachadas de recursos como fala, geração de imagens e compreensão
    de mídia são carregadas por APIs de runtime incluídas, mesmo quando o turno do agente
    verifica apenas uma resposta de texto simples.

- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor local do provedor AIMock para testes rápidos
    diretos do protocolo.
- `pnpm openclaw qa matrix`
  - Executa a faixa de QA ao vivo do Matrix em um homeserver Tuwunel
    descartável com suporte do Docker. Apenas para checkout do código-fonte — instalações empacotadas não incluem
    `qa-lab`.
  - CLI completa, catálogo de perfis/cenários, variáveis de ambiente e estrutura de artefatos:
    [QA do Matrix](/pt-BR/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Executa a faixa de QA ao vivo do Telegram em um grupo privado real usando os
    tokens dos bots controlador e SUT provenientes do ambiente.
  - Requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O ID do grupo deve ser o ID numérico
    do chat do Telegram.
  - Oferece suporte a `--credential-source convex` para credenciais compartilhadas em pool.
    Use o modo de ambiente por padrão ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`
    para optar por concessões do pool.
  - Os padrões abrangem canário, restrição por menção, endereçamento de comandos, `/status`,
    respostas mencionadas entre bots e respostas dos comandos nativos principais.
    Os padrões de `mock-openai` também abrangem regressões determinísticas de cadeias de respostas e
    de streaming da mensagem final do Telegram. Use `--list-scenarios`
    para verificações opcionais, como `session_status`.
  - Encerra com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` para
    gerar artefatos sem um código de saída de falha.
  - Requer dois bots distintos no mesmo grupo privado, com o bot SUT
    disponibilizando um nome de usuário do Telegram.
  - Para uma observação estável entre bots, ative Bot-to-Bot Communication Mode
    no `@BotFather` para ambos os bots e garanta que o bot controlador possa observar
    o tráfego de bots no grupo.
  - Grava um relatório de QA do Telegram, um resumo e `qa-evidence.json` em
    `.artifacts/qa-e2e/...`. Os cenários com resposta incluem o RTT desde a solicitação de envio
    do controlador até a resposta observada do SUT.

`Mantis Telegram Live` é o invólucro de evidências de PR desta faixa. Ele executa
a ref candidata com credenciais do Telegram concedidas pelo Convex, renderiza o
pacote de relatório/evidências de QA com dados sensíveis removidos em um navegador de desktop do Crabbox, grava evidências em MP4,
gera um GIF com trechos sem movimento removidos, envia o pacote de artefatos e
publica evidências embutidas no PR por meio do Mantis GitHub App quando `pr_number` está
definido. Os mantenedores podem iniciá-lo pela interface do Actions por meio de `Mantis Scenario`
(`scenario_id: telegram-live`) ou diretamente por um comentário em uma pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` é o invólucro agêntico antes/depois do Telegram Desktop
nativo para comprovação visual de PR. Inicie-o pela interface do Actions com
`instructions` em formato livre, por meio de `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) ou por um comentário no PR:

```text
@openclaw-mantis telegram desktop proof
```

O agente Mantis lê o PR, decide qual comportamento visível no Telegram comprova
a alteração, executa a faixa de comprovação do Telegram Desktop para usuário real do Crabbox nas
refs de linha de base e candidata, itera até que os GIFs nativos sejam úteis,
grava um manifesto `motionPreview` pareado e publica a mesma tabela de GIFs com 2 colunas
por meio do Mantis GitHub App quando `pr_number` está definido.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Obtém ou reutiliza um desktop Linux do Crabbox, instala o Telegram
    Desktop nativo, configura o OpenClaw com um token concedido do bot SUT do Telegram,
    inicia o Gateway e grava evidências em captura de tela/MP4 a partir do
    desktop VNC visível.
  - Usa `--credential-source convex` por padrão para que os fluxos de trabalho precisem apenas do
    segredo do agente do Convex. Use `--credential-source env` com as mesmas
    variáveis `OPENCLAW_QA_TELEGRAM_*` que `pnpm openclaw qa telegram`.
  - O Telegram Desktop ainda precisa de um login/perfil de usuário. O token do bot
    configura apenas o OpenClaw. Use `--telegram-profile-archive-env <name>`
    para um arquivo de perfil `.tgz` em base64 ou use `--keep-lease` e faça login
    manualmente uma vez pelo VNC.
  - Grava `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` e `telegram-desktop-builder.mp4`
    no diretório de saída.

As faixas de transporte ao vivo compartilham um contrato padrão para que novos transportes não
divirjam; a matriz de cobertura por faixa está em
[Visão geral de QA — Cobertura de transporte ao vivo](/pt-BR/concepts/qa-e2e-automation#live-transport-coverage).
`qa-channel` é a ampla suíte sintética e não faz parte dessa matriz.

### Credenciais compartilhadas do Telegram por meio do Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
está habilitado para QA de transporte ao vivo, o laboratório de QA adquire uma concessão exclusiva de um
pool apoiado pelo Convex, envia Heartbeats para essa concessão enquanto a faixa está em execução e
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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex de loopback com `http://` apenas para desenvolvimento local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` em operação normal.

Os comandos administrativos de mantenedor (adicionar/remover/listar no pool) exigem
especificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Auxiliares de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `doctor` antes de execuções ao vivo para verificar a URL do site Convex, os segredos do agente,
o prefixo do endpoint, o tempo limite HTTP e a acessibilidade administrativa/de listagem sem imprimir
valores secretos. Use `--json` para saída legível por máquina em scripts e utilitários
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

Cargas úteis multicanal validadas pelo agente:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

As faixas do Slack também podem obter concessões do pool, mas a validação da carga útil do Slack
atualmente fica no executor de QA do Slack, e não no agente. Use
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
para as linhas do Slack.

### Adição de um canal ao QA

A arquitetura e os nomes dos auxiliares de cenário para novos adaptadores de canal estão em
[Visão geral de QA — Adição de um canal](/pt-BR/concepts/qa-e2e-automation#adding-a-channel).
O requisito mínimo: implementar o executor de transporte na interface compartilhada do host `qa-lab`,
adicionar uma `adapterFactory` para cenários compartilhados, declarar `qaRunners` no
manifesto do Plugin, montar como `openclaw qa <runner>` e criar cenários em
`qa/scenarios/`.

## Suítes de testes (o que é executado e onde)

Pense nas suítes como um “realismo crescente” (e também instabilidade/custo crescentes).

### Unitários / integração (padrão)

- Comando: `pnpm test`
- Configuração: execuções sem alvo usam o conjunto de partições `vitest.full-*.config.ts` e podem
  expandir partições de vários projetos em configurações por projeto para agendamento
  paralelo
- Arquivos: inventários principais/unitários em `src/**/*.test.ts`,
  `packages/**/*.test.ts` e `test/**/*.test.ts`; os testes unitários da interface são executados na
  partição dedicada `unit-ui`
- Escopo:
  - Testes unitários puros
  - Testes de integração no processo (autenticação do Gateway, roteamento, ferramentas, análise sintática, configuração)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Executados em CI
  - Não exigem chaves reais
  - Devem ser rápidos e estáveis
  - Os testes do resolvedor e do carregador de superfície pública devem comprovar o comportamento amplo de fallback de `api.js` e
    `runtime-api.js` com pequenos fixtures gerados de Plugin,
    não com APIs reais do código-fonte de Plugins incluídos. Carregamentos reais da API de Plugins pertencem a
    suítes de contrato/integração mantidas pelo próprio Plugin.

Política de dependências nativas:

- As instalações de teste padrão ignoram compilações opcionais nativas do opus do Discord. A voz do Discord
  usa o `libopus-wasm` incluído, e `@discordjs/opus` permanece desabilitado em
  `allowBuilds` para que os testes locais e as faixas do Testbox não compilem o complemento
  nativo.
- Compare o desempenho do opus nativo no repositório de benchmark do `libopus-wasm`, não
  nos ciclos padrão de instalação/teste do OpenClaw. Não defina `@discordjs/opus` como
  `true` no `allowBuilds` padrão; isso faz com que ciclos de instalação/teste não relacionados
  compilem código nativo.

<AccordionGroup>
  <Accordion title="Projetos, partições e faixas com escopo">

    - Execuções não direcionadas de `pnpm test` usam treze configurações de shards menores (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um único processo nativo gigante do projeto raiz. Isso reduz o pico de RSS em máquinas sob carga e evita que o trabalho de resposta automática/plugins prive suítes não relacionadas de recursos.
    - `pnpm test --watch` ainda usa o grafo de projetos nativo de `vitest.config.ts` da raiz, porque um loop de observação com vários shards não é prático.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` encaminham primeiro os alvos explícitos de arquivos/diretórios pelas faixas com escopo definido, para que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evite pagar o custo total de inicialização do projeto raiz.
    - `pnpm test:changed` expande, por padrão, os caminhos alterados no Git em faixas baratas com escopo definido: edições diretas de testes, arquivos `*.test.ts` irmãos, mapeamentos explícitos de código-fonte e dependentes do grafo de importação local. Edições de configuração, preparação ou pacote não executam testes de forma ampla, a menos que você use explicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` é a barreira inteligente normal de verificações locais para trabalhos restritos. Ele classifica o diff em núcleo, testes do núcleo, extensões, testes de extensões, aplicativos, documentação, metadados de versão, ferramentas do Docker em tempo real e ferramentas, e então executa os comandos correspondentes de verificação de tipos, lint e proteção. Ele não executa testes do Vitest; use `pnpm test:changed` ou `pnpm test <target>` explícito como comprovação de testes. Incrementos de versão que alteram apenas metadados de versão executam verificações direcionadas de versão/configuração/dependências da raiz, com uma proteção que rejeita alterações de pacote fora do campo de versão de nível superior.
    - Edições no harness ACP do Docker em tempo real executam verificações focadas: sintaxe de shell para os scripts de autenticação do Docker em tempo real e uma simulação do agendador do Docker em tempo real. Alterações em `package.json` são incluídas somente quando o diff está limitado a `scripts["test:docker:live-*"]`; edições de dependências, exportações, versão e outras superfícies do pacote ainda usam as proteções mais amplas.
    - Testes unitários com poucas importações de agentes, comandos, plugins, auxiliares de resposta automática, `plugin-sdk` e áreas semelhantes de utilitários puros são encaminhados pela faixa `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos com estado ou uso intenso do runtime permanecem nas faixas existentes.
    - Arquivos-fonte auxiliares selecionados de `plugin-sdk` e `commands` também mapeiam execuções no modo de alterações para testes irmãos explícitos nessas faixas leves, para que edições nos auxiliares evitem executar novamente toda a suíte pesada desse diretório.
    - `auto-reply` tem grupos dedicados para auxiliares de nível superior do núcleo, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. A CI divide ainda mais a subárvore de respostas em shards de executor de agentes, despacho e roteamento de comandos/estado, para que um único grupo com muitas importações não monopolize toda a cauda do Node.
    - A CI normal de PR/main ignora intencionalmente a varredura em lote dos plugins integrados e o shard `agentic-plugins`, exclusivo de versões. A Validação Completa da Versão aciona o fluxo de trabalho filho separado `Plugin Prerelease` para essas suítes com uso intenso de plugins em candidatos a versão.

  </Accordion>

  <Accordion title="Cobertura do executor incorporado">

    - Ao alterar as entradas de descoberta da ferramenta de mensagens ou o contexto
      de runtime da Compaction, mantenha os dois níveis de cobertura.
    - Adicione regressões focadas dos auxiliares para limites puros de roteamento
      e normalização.
    - Mantenha íntegras as suítes de integração do executor incorporado:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` e
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Essas suítes verificam se IDs com escopo definido e o comportamento da Compaction
      continuam fluindo pelos caminhos reais de `run.ts` / `compact.ts`; testes
      apenas de auxiliares não substituem adequadamente esses caminhos de integração.

  </Accordion>

  <Accordion title="Padrões de pool e isolamento do Vitest">

    - A configuração base do Vitest usa `threads` por padrão.
    - A configuração compartilhada do Vitest fixa `isolate: false` e usa o
      executor não isolado nos projetos raiz e nas configurações e2e e em tempo real.
    - A faixa de UI da raiz mantém sua configuração e seu otimizador de `jsdom`, mas também
      é executada no executor compartilhado não isolado.
    - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false`
      da configuração compartilhada do Vitest.
    - `scripts/run-vitest.mjs` adiciona `--no-maglev` por padrão aos processos
      Node filhos do Vitest para reduzir a repetição de compilações do V8 durante grandes execuções locais.
      Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar com o comportamento
      padrão do V8.
    - `scripts/run-vitest.mjs` encerra execuções explícitas do Vitest fora do modo de observação
      após 5 minutos sem saída em stdout ou stderr. Defina
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` para desativar o monitor em
      uma investigação intencionalmente silenciosa.

  </Accordion>

  <Accordion title="Iteração local rápida">

    - `pnpm changed:lanes` mostra quais faixas arquiteturais um diff aciona.
    - O hook de pré-commit executa somente formatação. Ele adiciona novamente ao stage os arquivos formatados
      e não executa lint, verificação de tipos nem testes.
    - Execute `pnpm check:changed` explicitamente antes da entrega ou do push quando
      precisar da barreira inteligente de verificações locais.
    - `pnpm test:changed` é encaminhado por faixas baratas com escopo definido por padrão. Use
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando o agente
      decidir que uma edição no harness, na configuração, no pacote ou no contrato realmente precisa
      de uma cobertura mais ampla do Vitest.
    - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento,
      apenas com um limite maior de workers.
    - O dimensionamento automático de workers locais é intencionalmente conservador e recua
      quando a média de carga do host já está alta, para que várias execuções simultâneas
      do Vitest causem menos impacto por padrão.
    - A configuração base do Vitest marca os arquivos de projetos/configuração como
      `forceRerunTriggers`, para que as novas execuções no modo de alterações permaneçam corretas quando
      a estrutura dos testes mudar.
    - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado em
      hosts compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      para usar um local de cache explícito em uma análise direta de desempenho.

  </Accordion>

  <Accordion title="Depuração de desempenho">

    - `pnpm test:perf:imports` habilita o relatório de duração de importações do Vitest, além
      da saída de detalhamento das importações.
    - `pnpm test:perf:imports:changed` restringe a mesma visualização de análise de desempenho aos
      arquivos alterados desde `origin/main`.
    - Os dados de tempo dos shards são gravados em `.artifacts/vitest-shard-timings.json`.
      Execuções da configuração inteira usam o caminho da configuração como chave; shards de CI
      com padrão de inclusão acrescentam o nome do shard para que shards filtrados possam ser acompanhados
      separadamente.
    - Quando um teste crítico ainda passa a maior parte do tempo nas importações de inicialização,
      mantenha as dependências pesadas atrás de uma interface local restrita `*.runtime.ts` e
      simule essa interface diretamente, em vez de fazer importações profundas de auxiliares de runtime
      apenas para repassá-los por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara o
      `test:changed` roteado com o caminho nativo do projeto raiz para esse
      diff confirmado e exibe o tempo decorrido, além do RSS máximo no macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mede o desempenho da árvore de trabalho
      suja atual, encaminhando a lista de arquivos alterados por
      `scripts/test-projects.mjs` e pela configuração raiz do Vitest.
    - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para
      a sobrecarga de inicialização e transformação do Vitest/Vite.
    - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do executor para
      a suíte unitária com o paralelismo de arquivos desativado.

  </Accordion>
</AccordionGroup>

### Estabilidade (gateway)

- Comando: `pnpm test:stability:gateway`
- Configuração: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` e `test/vitest/vitest.infra.config.ts`, cada uma forçada a usar um worker
- Escopo:
  - Inicia um Gateway real em loopback com diagnósticos habilitados por padrão
  - Gera carga sintética de mensagens do gateway, memória e payloads grandes pelo caminho de eventos de diagnóstico
  - Consulta `diagnostics.stability` pelo RPC WS do Gateway
  - Abrange auxiliares de persistência do pacote de estabilidade de diagnóstico
  - Confirma que o gravador permanece limitado, que as amostras sintéticas de RSS ficam abaixo do orçamento de pressão e que as profundidades das filas por sessão retornam a zero
- Expectativas:
  - Seguro para CI e sem necessidade de chaves
  - Faixa restrita para acompanhamento de regressões de estabilidade, não substitui a suíte completa do Gateway

### E2E (agregado do repositório)

- Comando: `pnpm test:e2e`
- Escopo:
  - Executa a faixa E2E de smoke test do gateway
  - Executa a faixa E2E do navegador com simulação da Control UI
- Expectativas:
  - Seguro para CI e sem necessidade de chaves
  - Requer a instalação do Chromium do Playwright

### E2E (smoke test do gateway)

- Comando: `pnpm test:e2e:gateway`
- Configuração: `test/vitest/vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e testes E2E de plugins integrados em `extensions/`
- Padrões do runtime:
  - Usa `threads` do Vitest com `isolate: false`, como no restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - É executado em modo silencioso por padrão para reduzir a sobrecarga de E/S do console.
- Substituições úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a quantidade de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reabilitar a saída detalhada do console.
- Escopo:
  - Comportamento de ponta a ponta do gateway com várias instâncias
  - Superfícies WebSocket/HTTP, pareamento de nodes e redes mais pesadas
- Expectativas:
  - Executado na CI (quando habilitado no pipeline)
  - Não requer chaves reais
  - Mais componentes móveis que os testes unitários (pode ser mais lento)

### E2E (navegador simulado da Control UI)

- Comando: `pnpm test:ui:e2e`
- Configuração: `test/vitest/vitest.ui-e2e.config.ts`
- Arquivos: `ui/src/**/*.e2e.test.ts`
- Escopo:
  - Inicia a Control UI do Vite
  - Controla uma página real do Chromium pelo Playwright
  - Substitui o WebSocket do Gateway por simulações determinísticas no navegador
- Expectativas:
  - Executado na CI como parte de `pnpm test:e2e`
  - Não requer um Gateway real, agentes nem chaves de provedores
  - A dependência do navegador deve estar presente (`pnpm --dir ui exec playwright install chromium`)

### E2E: smoke test do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `extensions/openshell/src/backend.e2e.test.ts`
- Escopo:
  - Reutiliza um gateway OpenShell local ativo
  - Cria uma sandbox a partir de um Dockerfile local temporário
  - Testa o backend OpenShell do OpenClaw por meio de `sandbox ssh-config` + execução via SSH reais
  - Verifica o comportamento canônico remoto do sistema de arquivos por meio da ponte fs da sandbox
- Expectativas:
  - Somente mediante ativação; não faz parte da execução padrão de `pnpm test:e2e`
  - Requer uma CLI `openshell` local, além de um daemon do Docker funcional
  - Requer um gateway OpenShell local ativo e sua fonte de configuração
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados e depois destrói a sandbox de teste
- Substituições úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário da CLI ou script wrapper fora do padrão
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` para expor a configuração do gateway registrado ao teste isolado
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` para substituir o IP do gateway do Docker usado pelo fixture de política do host

### Em tempo real (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `test/vitest/vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e testes live de plugins incluídos em `extensions/`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - "Este provedor/modelo realmente funciona _hoje_ com credenciais reais?"
  - Detectar alterações no formato do provedor, peculiaridades na chamada de ferramentas, problemas de autenticação e comportamento dos limites de taxa
- Expectativas:
  - Não é estável para CI por definição (redes reais, políticas reais dos provedores, cotas, indisponibilidades)
  - Custa dinheiro / consome limites de taxa
  - Prefira executar subconjuntos específicos em vez de "tudo"
- As execuções live usam chaves de API já exportadas e perfis de autenticação preparados.
- Por padrão, as execuções live ainda isolam `HOME` e copiam o material de configuração/autenticação para um diretório inicial temporário de teste, para que os fixtures de testes unitários não possam modificar seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` somente quando você precisar intencionalmente que os testes live usem seu diretório inicial real.
- `pnpm test:live` usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...` e silencia os logs de inicialização do Gateway e as mensagens do Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser restaurar todos os logs de inicialização.
- Rotação de chaves de API (específica do provedor): defina `*_API_KEYS` no formato separado por vírgulas/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou uma substituição específica para live por meio de `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de limite de taxa.
- Saída de progresso/Heartbeat:
  - As suítes live emitem linhas de progresso no stderr para que chamadas longas aos provedores permaneçam visivelmente ativas, mesmo quando a captura do console pelo Vitest estiver silenciosa.
  - `test/vitest/vitest.live.config.ts` desabilita a interceptação do console pelo Vitest para que as linhas de progresso do provedor/Gateway sejam transmitidas imediatamente durante as execuções live.
  - Ajuste os Heartbeats de modelos diretos com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste os Heartbeats do Gateway/das sondagens com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Ao editar lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se você alterou muita coisa)
- Ao modificar a rede do Gateway / protocolo WS / emparelhamento: adicione `pnpm test:e2e`
- Ao depurar "meu bot está fora do ar" / falhas específicas do provedor / chamada de ferramentas: execute um `pnpm test:live` específico

## Testes live (que acessam a rede)

Para a matriz de modelos live, testes de fumaça de backends da CLI, testes de fumaça do ACP, harness do app-server do Codex e todos os testes live de provedores de mídia (Deepgram, BytePlus, ComfyUI, imagem, música, vídeo, harness de mídia) — além do processamento de credenciais para execuções live

- consulte [Testando suítes live](/pt-BR/help/testing-live). Para a lista de verificação dedicada de atualização e
  validação de plugins, consulte
  [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins).

## Executores Docker (verificações opcionais de "funciona no Linux")

Esses executores Docker são divididos em duas categorias:

- Executores de modelos live: `test:docker:live-models` e `test:docker:live-gateway` executam somente o arquivo live correspondente à chave de perfil dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório local de configuração, workspace e arquivo opcional de ambiente do perfil. Os pontos de entrada locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Os executores Docker live mantêm seus próprios limites práticos quando necessário:
  `test:docker:live-models` usa por padrão o conjunto selecionado de alta relevância com suporte, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Defina `OPENCLAW_LIVE_MAX_MODELS`
  ou as variáveis de ambiente do Gateway quando quiser explicitamente um limite menor ou uma varredura maior.
- `test:docker:all` compila a imagem Docker live uma vez por meio de `test:docker:live-build`, empacota o OpenClaw uma vez como um tarball npm por meio de `scripts/package-openclaw-for-docker.mjs` e, em seguida, compila/reutiliza duas imagens de `scripts/e2e/Dockerfile`. A imagem básica é apenas o executor Node/Git para as faixas de instalação/atualização/dependências de plugins; essas faixas montam o tarball pré-compilado. A imagem funcional instala o mesmo tarball em `/app` para as faixas de funcionalidade do aplicativo compilado. As definições das faixas Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`; a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` executa o plano selecionado. O agregador usa um escalonador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla os slots de processos, enquanto os limites de recursos impedem que faixas live pesadas, de instalação npm e com vários serviços sejam todas iniciadas ao mesmo tempo. Se uma única faixa for mais pesada que os limites ativos, o escalonador ainda poderá iniciá-la quando o pool estiver vazio e a manterá em execução sozinha até que haja capacidade disponível novamente. Os padrões são 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajuste `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (e outras substituições `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`) somente quando o host Docker tiver mais capacidade disponível. Por padrão, o executor realiza uma pré-verificação do Docker, remove contêineres E2E obsoletos do OpenClaw, exibe o status a cada 30 segundos, armazena os tempos das faixas bem-sucedidas em `.artifacts/docker-tests/lane-timings.json` e usa esses tempos para iniciar primeiro as faixas mais longas nas execuções posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para exibir o manifesto ponderado das faixas sem compilar nem executar o Docker, ou `node scripts/test-docker-all.mjs --plan-json` para exibir o plano de CI das faixas selecionadas, as necessidades de pacotes/imagens e as credenciais.
- `Package Acceptance` é a verificação de pacote nativa do GitHub para "este tarball instalável funciona como produto?". Ela resolve um pacote candidato de `source=npm`, `source=ref`, `source=url`, `source=trusted-url` ou `source=artifact`, envia-o como `package-under-test` e, em seguida, executa as faixas Docker E2E reutilizáveis nesse tarball exato, em vez de reempacotar a referência selecionada. Os perfis são ordenados por abrangência: `smoke`, `package`, `product` e `full` (além de `custom` para uma lista explícita de faixas). Consulte [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins) para conhecer o contrato de pacote/atualização/plugin, a matriz de sobrevivência de atualizações publicadas, os padrões de lançamento e a triagem de falhas.
- As verificações de compilação e lançamento executam `scripts/check-cli-bootstrap-imports.mjs` após o tsdown. A proteção percorre o grafo estático compilado a partir de `dist/entry.js` e `dist/cli/run-main.js` e falha se esse grafo de inicialização anterior ao despacho importar estaticamente qualquer pacote externo (Commander, interface de prompts, undici, registro de logs e dependências semelhantes que tornam a inicialização pesada contam) antes do despacho do comando; ela também limita o chunk de execução incluído do Gateway a 70 KB e rejeita importações estáticas de caminhos frios conhecidos do Gateway (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`) a partir desse chunk. Separadamente, `scripts/release-check.ts` testa o CLI empacotado com `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` e `models list --provider openai`.
- A compatibilidade legada do Package Acceptance está limitada a `2026.4.25` (`2026.4.25-beta.*` incluído). Até esse limite, o harness tolera apenas lacunas de metadados de pacotes lançados: entradas omitidas do inventário privado de QA, ausência de `gateway install --wrapper`, arquivos de patch ausentes no fixture do Git derivado do tarball, ausência de `update.channel` persistido, locais legados de registros de instalação de plugins, ausência de persistência dos registros de instalação do marketplace e migração dos metadados de configuração durante `plugins update`. Para pacotes posteriores a `2026.4.25`, esses caminhos são falhas estritas.
- Executores de testes de fumaça em contêineres: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` e `test:docker:config-reload` inicializam um ou mais contêineres reais e verificam caminhos de integração de nível mais alto.
- As faixas E2E Docker/Bash que instalam o tarball empacotado do OpenClaw por meio de `scripts/lib/openclaw-e2e-instance.sh` limitam `npm install` a `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (padrão `600s`; defina `0` para desabilitar o wrapper durante a depuração).

Os executores Docker de modelos live também montam por bind somente os diretórios iniciais de autenticação da CLI necessários
(ou todos os compatíveis quando a execução não está restrita) e depois os copiam para o diretório inicial do
contêiner antes da execução, para que o OAuth da CLI externa possa atualizar tokens
sem modificar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Teste de fumaça de bind do ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; abrange Claude, Codex e Gemini por padrão, com cobertura estrita de Droid/OpenCode por meio de `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Teste de fumaça de backend da CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Teste de fumaça do harness do app-server do Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desenvolvimento: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Testes de fumaça de observabilidade: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` e `pnpm qa:observability:smoke` são faixas privadas de QA do checkout do código-fonte. Elas não fazem parte intencionalmente das faixas Docker de lançamento de pacotes porque o tarball npm omite o QA Lab.
- Teste de fumaça live do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de integração inicial (TTY, estrutura completa): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Teste de fumaça de integração inicial/canal/agente do tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente o tarball empacotado do OpenClaw no Docker, configura o OpenAI por meio da integração inicial com referência de variável de ambiente, além do Telegram por padrão, executa o doctor e executa um turno simulado do agente OpenAI. Reutilize um tarball pré-compilado com `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignore a recompilação no host com `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ou altere o canal com `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ou `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke da jornada do usuário na versão: `pnpm test:docker:release-user-journey` instala globalmente o tarball empacotado do OpenClaw em um diretório inicial limpo do Docker, executa a integração inicial, configura um provedor OpenAI simulado, executa um turno do agente, instala/desinstala plugins externos, configura o ClickClack com um fixture local, verifica mensagens de saída/entrada, reinicia o Gateway e executa o doctor.
- Smoke da integração inicial tipada na versão: `pnpm test:docker:release-typed-onboarding` instala o tarball empacotado, conduz `openclaw onboard` por meio de um TTY real, configura o OpenAI como um provedor com referência a variável de ambiente, verifica que nenhuma chave bruta seja persistida e executa um turno simulado do agente.
- Smoke de mídia/memória na versão: `pnpm test:docker:release-media-memory` instala o tarball empacotado, verifica a compreensão de imagem a partir de um anexo PNG, a saída de geração de imagem compatível com OpenAI, a recuperação pela busca na memória e a persistência dessa recuperação após a reinicialização do Gateway.
- Smoke da jornada de atualização do usuário na versão: `pnpm test:docker:release-upgrade-user-journey` instala, por padrão, a versão-base publicada mais recente anterior ao tarball candidato, configura o estado do provedor/plugin/ClickClack no pacote publicado, atualiza para o tarball candidato e, em seguida, executa novamente a jornada principal de agente/plugin/canal. Se não existir uma versão-base publicada anterior, ele reutiliza a versão candidata. Substitua a versão-base com `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke do marketplace de plugins na versão: `pnpm test:docker:release-plugin-marketplace` instala a partir de um marketplace de fixtures local, atualiza o plugin instalado, desinstala-o e verifica que a CLI do plugin desaparece com a remoção dos metadados de instalação.
- Smoke de instalação de Skill: `pnpm test:docker:skill-install` instala globalmente o tarball empacotado do OpenClaw no Docker, desativa na configuração as instalações de arquivos enviados, resolve pela busca o slug atual da Skill ativa no ClawHub, instala-a com `openclaw skills install` e verifica a Skill instalada, além dos metadados de origem/bloqueio de `.clawhub`.
- Smoke de troca do canal de atualização: `pnpm test:docker:update-channel-switch` instala globalmente o tarball empacotado do OpenClaw no Docker, troca do pacote `stable` para o git `dev`, verifica o canal persistido e o funcionamento do plugin após a atualização e, em seguida, retorna ao pacote `stable` e verifica o status da atualização.
- Smoke de sobrevivência à atualização: `pnpm test:docker:upgrade-survivor` instala o tarball empacotado do OpenClaw sobre um fixture sujo de usuário antigo com agentes, configuração de canal, listas de permissões de plugins, estado obsoleto de dependências de plugins e arquivos existentes de espaço de trabalho/sessão. Ele executa a atualização do pacote e o doctor não interativo sem chaves ativas de provedor ou canal; em seguida, inicia um Gateway de loopback e verifica a preservação da configuração/do estado, além dos limites de inicialização/status.
- Smoke publicado de sobrevivência à atualização: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` por padrão, prepara arquivos realistas de usuários existentes, configura essa versão-base com uma receita de comandos incorporada, valida a configuração resultante, atualiza essa instalação publicada para o tarball candidato, executa o doctor não interativo, grava `.artifacts/upgrade-survivor/summary.json` e, em seguida, inicia um Gateway de loopback e verifica as intenções configuradas, a preservação do estado, a inicialização, `/healthz`, `/readyz` e os limites de status de RPC. Substitua uma versão-base com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, solicite ao agendador agregado que expanda versões-base locais exatas com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, e expanda fixtures no formato de problemas com `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, como `reported-issues`; o conjunto de problemas relatados inclui `configured-plugin-installs` para o reparo automático da instalação de plugins externos do OpenClaw. A Aceitação de Pacote os expõe como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, resolve tokens de metaversão-base, como `last-stable-4` ou `all-since-2026.4.23`, e a Validação Completa da Versão expande a verificação de pacote de teste prolongado da versão para `last-stable-4 2026.4.23 2026.5.2 2026.4.15`, além de `reported-issues`.
- Smoke de contexto de runtime da sessão: `pnpm test:docker:session-runtime-context` verifica a persistência oculta da transcrição do contexto de runtime, além do reparo pelo doctor das ramificações duplicadas afetadas de reescrita de prompts.
- Smoke de instalação global com Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empacota a árvore atual, instala-a com `bun install -g` em um diretório inicial isolado e verifica que `openclaw infer image providers --json` retorna provedores de imagem incluídos, em vez de travar. Reutilize um tarball pré-compilado com `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignore a compilação do host com `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ou copie `dist/` de uma imagem Docker compilada com `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke do instalador no Docker: `bash scripts/test-install-sh-docker.sh` compartilha um único cache do npm entre seus contêineres raiz, de atualização e de npm direto. O smoke de atualização usa, por padrão, a versão `latest` do npm como versão-base estável antes da atualização para o tarball candidato. Substitua-a localmente com `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ou, no GitHub, com a entrada `update_baseline_version` do fluxo de trabalho Install Smoke. As verificações do instalador sem acesso raiz mantêm um cache npm isolado para que entradas de cache pertencentes ao usuário raiz não ocultem o comportamento de instalação local do usuário. Defina `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar o cache de raiz/atualização/npm direto entre reexecuções locais.
- A CI de Install Smoke ignora a atualização global duplicada via npm direto com `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; execute o script localmente sem essa variável de ambiente quando for necessária a cobertura direta de `npm install -g`.
- Smoke da CLI de exclusão de espaço de trabalho compartilhado por agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila por padrão a imagem do Dockerfile raiz, prepara dois agentes com um espaço de trabalho em um diretório inicial isolado do contêiner, executa `agents delete --json` e verifica o JSON válido, além do comportamento de retenção do espaço de trabalho. Reutilize a imagem de smoke de instalação com `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Rede do Gateway e ciclo de vida do host: `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`) preserva o smoke de autenticação/integridade via WebSocket em LAN com dois contêineres e, em seguida, usa HTTP administrativo de loopback para comprovar o bloqueio de preparação, o acesso com controle retido, a recuperação por retomada e uma parada/inicialização preparada no mesmo contêiner. A verificação da reinicialização deve terminar antes que a concessão original expire, verifica que o estado de suspensão é local ao processo enquanto a configuração persistida do Gateway e a identidade do contêiner sobrevivem e emite um JSON de temporização das fases legível por máquina.
- Smoke de snapshot CDP do navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila a imagem E2E de origem com uma camada do Chromium, inicia o Chromium com CDP bruto, executa `browser doctor --deep` e verifica que os snapshots de funções do CDP abrangem URLs de links, elementos clicáveis promovidos por cursor, referências de iframe e metadados de quadro.
- Regressão de raciocínio mínimo do web_search do OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) executa um servidor OpenAI simulado por meio do Gateway, verifica que `web_search` eleva `reasoning.effort` de `minimal` para `low`, força então a rejeição do esquema pelo provedor e verifica que os detalhes brutos aparecem nos logs do Gateway.
- Ponte de canal MCP (Gateway preparado + ponte stdio + smoke de quadro bruto de notificação do Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Ferramentas MCP do pacote OpenClaw (servidor MCP stdio real + smoke de permissão/negação do perfil incorporado do OpenClaw): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Limpeza de Cron/subagente MCP (Gateway real + encerramento do processo filho MCP stdio após execuções isoladas de Cron e subagente de execução única): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalação/atualização para caminho local, `file:`, registro npm com dependências elevadas, metadados malformados de pacote npm, referências móveis do git, pacote abrangente do ClawHub, atualizações do marketplace e ativação/inspeção do pacote Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Defina `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para ignorar o bloco do ClawHub ou substitua o par padrão de pacote/runtime abrangente com `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sem `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, o teste usa um servidor de fixtures local e hermético do ClawHub.
- Smoke de atualização inalterada de plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke da matriz de ciclo de vida de plugins: `pnpm test:docker:plugin-lifecycle-matrix` instala o tarball empacotado do OpenClaw em um contêiner básico, instala um plugin npm, alterna entre ativação/desativação, atualiza-o e rebaixa sua versão por meio de um registro npm local, exclui o código instalado e, em seguida, verifica que a desinstalação ainda remove o estado obsoleto enquanto registra métricas de RSS/CPU para cada fase do ciclo de vida.
- Smoke de metadados de recarregamento da configuração: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` abrange o smoke de instalação/atualização para caminho local, `file:`, registro npm com dependências elevadas, referências móveis do git, fixtures do ClawHub, atualizações do marketplace e ativação/inspeção do pacote Claude. `pnpm test:docker:plugin-update` abrange o comportamento de atualização inalterada para plugins instalados. `pnpm test:docker:plugin-lifecycle-matrix` abrange instalação, ativação, desativação, atualização, rebaixamento e desinstalação com código ausente de plugins npm com rastreamento de recursos.

Para pré-compilar e reutilizar manualmente a imagem funcional compartilhada:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

As substituições de imagem específicas da suíte, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, ainda têm precedência quando definidas. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` aponta para uma imagem remota compartilhada, os scripts a baixam se ela ainda não estiver disponível localmente. Os testes Docker de QR e do instalador mantêm seus próprios Dockerfiles porque validam o comportamento do pacote/da instalação, e não o runtime compartilhado da aplicação compilada.

Os executores Docker com modelos ativos também montam o checkout atual como somente leitura
e o preparam em um diretório de trabalho temporário dentro do contêiner. Isso mantém a
imagem de runtime enxuta e, ao mesmo tempo, executa o Vitest com exatamente o seu
código-fonte/configuração local. A etapa de preparação ignora caches grandes usados somente localmente e saídas
de compilação da aplicação, como `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e
diretórios de saída `.build` locais da aplicação ou do Gradle, para que as execuções ativas no Docker não
levem minutos copiando artefatos específicos da máquina. Elas também definem
`OPENCLAW_SKIP_CHANNELS=1` para que as sondagens ativas do Gateway não iniciem workers reais de canais
Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`; portanto, também repasse
`OPENCLAW_LIVE_GATEWAY_*` quando precisar restringir ou excluir a cobertura ativa do Gateway
dessa etapa do Docker.

`test:docker:openwebui` é um smoke test de compatibilidade de nível mais alto: ele inicia um
contêiner do Gateway do OpenClaw com os endpoints HTTP compatíveis com a OpenAI habilitados,
inicia um contêiner fixado do Open WebUI apontando para esse Gateway, faz login pelo
Open WebUI, verifica se `/api/models` expõe `openclaw/default` e, em seguida, envia uma
solicitação de chat real pelo proxy `/api/chat/completions` do Open WebUI. Defina
`OPENWEBUI_SMOKE_MODE=models` para verificações de CI do fluxo de lançamento que devem parar
após o login no Open WebUI e a descoberta de modelos, sem aguardar a conclusão de um modelo
ao vivo. A primeira execução pode ser consideravelmente mais lenta porque o Docker pode precisar
baixar a imagem do Open WebUI e o Open WebUI pode precisar concluir sua própria
configuração de inicialização a frio. Essa lane espera uma chave de modelo ao vivo utilizável, fornecida pelo
ambiente do processo, por perfis de autenticação preparados ou por um
`OPENCLAW_PROFILE_FILE` explícito. As execuções bem-sucedidas exibem um pequeno payload JSON como
`{ "ok": true, "model": "openclaw/default", ... }`.

`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real do Telegram, Discord ou iMessage. Ele inicializa um contêiner do Gateway
com dados predefinidos, inicia um segundo contêiner que executa `openclaw mcp serve` e, em seguida,
verifica a descoberta de conversas roteadas, leituras de transcrições, metadados de
anexos, comportamento da fila de eventos ao vivo, roteamento de envios de saída e notificações
de canal + permissão no estilo Claude pela ponte MCP stdio real. A
verificação de notificações inspeciona diretamente os frames MCP stdio brutos para que o smoke test
valide o que a ponte realmente emite, e não apenas o que um SDK de cliente específico
por acaso expõe.

`test:docker:agent-bundle-mcp-tools` é determinístico e não precisa de uma
chave de modelo ao vivo. Ele compila a imagem Docker do repositório, inicia um servidor
de sondagem MCP stdio real dentro do contêiner, materializa esse servidor pelo
runtime MCP do pacote OpenClaw incorporado, executa a ferramenta e, em seguida, verifica se
`coding` e `messaging` mantêm as ferramentas `bundle-mcp`, enquanto `minimal` e
`tools.deny: ["bundle-mcp"]` as filtram.

`test:docker:cron-mcp-cleanup` é determinístico e não precisa de uma chave de
modelo ao vivo. Ele inicia um Gateway com dados predefinidos e um servidor de sondagem MCP stdio real,
executa um turno Cron isolado e um turno filho de execução única de `sessions_spawn` e, em seguida,
verifica se o processo filho MCP é encerrado após cada execução.

Smoke test manual de thread ACP em linguagem natural (não faz parte da CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de trabalho de regressão/depuração. Ele pode ser necessário novamente para a validação do roteamento de threads ACP, portanto, não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` montado e carregado antes da execução dos testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas as variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de configuração/espaço de trabalho e sem montagens externas de autenticação da CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`, a menos que a execução já use um diretório de bind gerenciado/de CI) montado em `/home/node/.npm-global` para armazenar em cache as instalações da CLI dentro do Docker
- Diretórios/arquivos externos de autenticação da CLI em `$HOME` são montados como somente leitura em `/host-auth...` e depois copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão (usados quando a execução não está restrita a provedores específicos): `.factory`, `.gemini`, `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções restritas a provedores montam somente os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Substitua manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas, como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em novas execuções que não precisem de uma nova compilação
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do armazenamento de perfis (não do ambiente)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo Gateway para o smoke test do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação de nonce usado pelo smoke test do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag fixada da imagem do Open WebUI

## Verificação de integridade da documentação

Execute as verificações da documentação após editar documentos: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando também precisar verificar títulos dentro da página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de "pipeline real" sem provedores reais:

- Chamada de ferramentas do Gateway (OpenAI simulada, Gateway real + loop do agente): `src/gateway/gateway.test.ts` (caso: "executa uma chamada simulada de ferramenta da OpenAI de ponta a ponta pelo loop do agente do Gateway")
- Assistente do Gateway (WS `wizard.start`/`wizard.next`, grava configuração + autenticação obrigatória): `src/gateway/gateway.test.ts` (caso: "executa o assistente por ws e grava a configuração do token de autenticação")

## Avaliações de confiabilidade do agente (Skills)

Já temos alguns testes seguros para CI que se comportam como "avaliações de confiabilidade do agente":

- Chamada simulada de ferramentas pelo Gateway real + loop do agente (`src/gateway/gateway.test.ts`).
- Fluxos de ponta a ponta do assistente que validam a integração da sessão e os efeitos da configuração (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (consulte [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills são listadas no prompt, o agente escolhe a Skill correta (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes do uso e segue as etapas/argumentos obrigatórios?
- **Contratos de fluxo de trabalho:** cenários de vários turnos que verificam a ordem das ferramentas, a continuidade do histórico da sessão e os limites do sandbox.

As avaliações futuras devem primeiro permanecer determinísticas:

- Um executor de cenários que use provedores simulados para verificar chamadas de ferramentas + ordem, leituras de arquivos de Skills e integração da sessão.
- Um pequeno conjunto de cenários voltados a Skills (usar ou evitar, restrições, injeção de prompt).
- Avaliações ao vivo opcionais (com adesão explícita e controladas por variáveis de ambiente) somente depois que o conjunto seguro para CI estiver implementado.

## Testes de contrato (formato de plugins e canais)

Os testes de contrato verificam se cada plugin e canal registrado está em conformidade com
seu contrato de interface. Eles percorrem todos os plugins descobertos e executam um
conjunto de verificações de formato e comportamento. A lane de testes unitários padrão de `pnpm test`
ignora intencionalmente esses arquivos compartilhados de smoke test e de pontos de integração; execute os comandos
de contrato explicitamente ao alterar superfícies compartilhadas de canais ou provedores.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Somente contratos de canais: `pnpm test:contracts:channels`
- Somente contratos de provedores: `pnpm test:contracts:plugins`

### Contratos de canais

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`. Categorias atuais
de nível superior:

- **channel-catalog** - metadados de entradas do catálogo de canais incorporados/do registro
- **plugin** (baseado em registro, fragmentado) - formato básico de registro do plugin
- **surfaces-only** (baseado em registro, fragmentado) - verificações de formato por superfície para `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` e `gateway`
- **session-binding** (baseado em registro) - comportamento de vinculação de sessão
- **outbound-payload** - estrutura e normalização do payload de mensagens
- **group-policy** (fallback) - aplicação da política padrão de grupos por canal
- **threading** (baseado em registro, fragmentado) - tratamento de ids de threads
- **directory** (baseado em registro, fragmentado) - API de diretório/lista
- **registry** e **plugins-core.\*** - registro de plugins de canais, carregador e componentes internos de autorização de gravação de configuração

Os auxiliares do harness de captura de despacho de entrada e de payload de saída usados por esses
conjuntos são expostos internamente por `src/plugin-sdk/channel-contract-testing.ts`
(excluído do npm, não é um subcaminho público do SDK); não há um arquivo independente
`inbound.contract.test.ts` neste diretório.

### Contratos de provedores

Localizados em `src/plugins/contracts/*.contract.test.ts`. As categorias atuais
incluem:

- **shape** - manifesto do plugin, API e formato das exportações do runtime
- **plugin-registration** (+ paralelo) - casos de registro de manifesto
- **package-manifest** - requisitos do manifesto do pacote
- **loader** - comportamento de configuração/desmontagem do carregador de plugins
- **registry** - conteúdo e consulta do registro de contratos de plugins
- **providers** - comportamento compartilhado dos provedores incorporados, além de provedores de pesquisa na web
- **auth-choice** - metadados de escolha de autenticação e comportamento da configuração
- **provider-catalog-deprecation** - metadados obsoletos do catálogo de provedores
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options** - contratos do assistente de configuração de provedores
- **embedding-provider**, **memory-embedding-provider**, **web-fetch-provider**, **tts** - contratos de provedores específicos por recurso
- **session-actions**, **session-attachments**, **session-entry-projection** - contratos de estado de sessão pertencentes ao plugin
- **scheduled-turns** - metadados de turnos agendados do plugin e limites de timestamp
- **host-hooks**, **run-context-lifecycle**, **runtime-import-side-effects**, **runtime-seams** - contratos do ciclo de vida do host/runtime do plugin e dos limites de importação
- **extension-runtime-dependencies** - posicionamento das dependências de runtime para extensões

### Quando executar

- Após alterar exportações ou subcaminhos do plugin-sdk
- Após adicionar ou modificar um plugin de canal ou provedor
- Após refatorar o registro ou a descoberta de plugins

Os testes de contrato são executados na CI e não exigem chaves de API reais.

## Adição de regressões (orientações)

Ao corrigir um problema de provedor/modelo descoberto em ambiente ao vivo:

- Adicione uma regressão segura para CI, se possível (provedor simulado/stub ou captura da transformação exata do formato da solicitação)
- Se for inerentemente exclusivo do ambiente ao vivo (limites de taxa, políticas de autenticação), mantenha o teste ao vivo restrito e habilitado explicitamente por variáveis de ambiente
- Prefira direcionar o teste à menor camada que detecte o bug:
  - bug de conversão/reprodução da solicitação do provedor -> teste direto de modelos
  - bug no pipeline de sessão/histórico/ferramentas do Gateway -> smoke test ao vivo do Gateway ou teste simulado do Gateway seguro para CI
- Proteção contra travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um destino de amostra por classe de SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`) e, em seguida, verifica se ids de execução com segmentos de travessia são rejeitados.
  - Se você adicionar uma nova família de destinos SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente para ids de destino não classificados, para que novas classes não possam ser ignoradas silenciosamente.

## Relacionados

- [Testes ao vivo](/pt-BR/help/testing-live)
- [Testes de atualizações e plugins](/pt-BR/help/testing-updates-plugins)
- [CI](/pt-BR/ci)
