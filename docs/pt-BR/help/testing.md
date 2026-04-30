---
read_when:
    - Executando testes localmente ou em CI
    - Adicionando testes de regressão para bugs de modelo/provedor
    - Depuração do comportamento do Gateway + agente
summary: 'Kit de testes: suítes unitárias/e2e/ao vivo, executores Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-04-30T18:38:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 470a96c6b47c2708950d05adc4a4efba5fe290f0675a131e2888d2d0032d5953
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tem três suítes Vitest (unitária/integração, e2e, ao vivo) e um pequeno conjunto
de executores Docker. Este documento é um guia de "como testamos":

- O que cada suíte cobre (e o que ela deliberadamente _não_ cobre).
- Quais comandos executar para fluxos de trabalho comuns (local, antes do push, depuração).
- Como os testes ao vivo descobrem credenciais e selecionam modelos/provedores.
- Como adicionar regressões para problemas reais de modelos/provedores.

<Note>
**Pilha de QA (qa-lab, qa-channel, faixas de transporte ao vivo)** é documentada separadamente:

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) — arquitetura, superfície de comandos, criação de cenários.
- [QA de Matrix](/pt-BR/concepts/qa-matrix) — referência para `pnpm openclaw qa matrix`.
- [Canal de QA](/pt-BR/channels/qa-channel) — o plugin de transporte sintético usado por cenários baseados no repositório.

Esta página cobre a execução das suítes de teste regulares e dos executores Docker/Parallels. A seção de executores específicos de QA abaixo ([executores específicos de QA](#qa-specific-runners)) lista as invocações `qa` concretas e aponta de volta para as referências acima.
</Note>

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes do push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina espaçosa: `pnpm test:max`
- Loop de observação direto do Vitest: `pnpm test:watch`
- O direcionamento direto de arquivos agora também roteia caminhos de extensão/canal: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira execuções direcionadas primeiro quando estiver iterando em uma única falha.
- Site de QA apoiado por Docker: `pnpm qa:lab:up`
- Faixa de QA apoiada por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você tocar em testes ou quiser confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar provedores/modelos reais (requer credenciais reais):

- Suíte ao vivo (modelos + sondagens de ferramenta/imagem do Gateway): `pnpm test:live`
- Direcione um arquivo ao vivo silenciosamente: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Varredura ao vivo de modelos no Docker: `pnpm test:docker:live-models`
  - Cada modelo selecionado agora executa um turno de texto mais uma pequena sondagem no estilo leitura de arquivo.
    Modelos cujos metadados anunciam entrada `image` também executam um turno minúsculo com imagem.
    Desative as sondagens extras com `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ao isolar falhas de provedor.
  - Cobertura de CI: `OpenClaw Scheduled Live And E2E Checks` diário e
    `OpenClaw Release Checks` manual chamam o fluxo de trabalho reutilizável ao vivo/E2E com
    `include_live_suites: true`, que inclui jobs separados de matriz de modelos ao vivo no Docker
    fragmentados por provedor.
  - Para reexecuções de CI focadas, dispare `OpenClaw Live And E2E Checks (Reusable)`
    com `include_live_suites: true` e `live_models_only: true`.
  - Adicione novos segredos de provedores de alto sinal a `scripts/ci-hydrate-live-auth.sh`
    mais `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e seus
    chamadores agendados/de release.
- Smoke de chat vinculado nativo do Codex: `pnpm test:docker:live-codex-bind`
  - Executa uma faixa ao vivo no Docker contra o caminho do servidor de aplicativo do Codex, vincula uma
    DM sintética do Slack com `/codex bind`, exercita `/codex fast` e
    `/codex permissions`, então verifica uma resposta simples e um anexo de imagem
    roteados pela vinculação nativa do plugin em vez de ACP.
- Smoke do harness do servidor de aplicativo do Codex: `pnpm test:docker:live-codex-harness`
  - Executa turnos de agente do Gateway pelo harness do servidor de aplicativo do Codex pertencente ao plugin,
    verifica `/codex status` e `/codex models` e, por padrão, exercita sondagens de imagem,
    MCP de cron, subagente e Guardian. Desative a sondagem de subagente com
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ao isolar outras falhas do servidor de aplicativo
    do Codex. Para uma verificação focada de subagente, desative as outras sondagens:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Isso sai após a sondagem de subagente, a menos que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esteja definido.
- Smoke do comando de resgate do Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Verificação opt-in de redundância para a superfície do comando de resgate do canal de mensagens.
    Ela exercita `/crestodian status`, enfileira uma alteração persistente de modelo,
    responde `/crestodian yes` e verifica o caminho de gravação de auditoria/configuração.
- Smoke Docker do planejador do Crestodian: `pnpm test:docker:crestodian-planner`
  - Executa o Crestodian em um contêiner sem configuração com uma CLI Claude falsa no `PATH`
    e verifica se o fallback do planejador aproximado é traduzido em uma gravação tipada
    de configuração auditada.
- Smoke Docker de primeira execução do Crestodian: `pnpm test:docker:crestodian-first-run`
  - Começa de um diretório de estado vazio do OpenClaw, roteia `openclaw` puro para
    o Crestodian, aplica gravações de configuração/modelo/agente/plugin Discord + SecretRef,
    valida a configuração e verifica entradas de auditoria. O mesmo caminho de configuração Ring 0
    também é coberto no QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de custo Moonshot/Kimi: com `MOONSHOT_API_KEY` definido, execute
  `openclaw models list --provider moonshot --json`, depois execute um
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolado contra `moonshot/kimi-k2.6`. Verifique se o JSON relata Moonshot/K2.6 e se a
  transcrição do assistente armazena `usage.cost` normalizado.

<Tip>
Quando você só precisa de um caso com falha, prefira restringir testes ao vivo pelas variáveis de ambiente de lista de permissões descritas abaixo.
</Tip>

## Executores específicos de QA

Estes comandos ficam ao lado das principais suítes de teste quando você precisa de realismo de QA-lab:

O CI executa o QA Lab em fluxos de trabalho dedicados. `Parity gate` executa em PRs correspondentes e
por disparo manual com provedores mock. `QA-Lab - All Lanes` executa todas as noites em
`main` e por disparo manual com o gate de paridade mock, faixa Matrix ao vivo,
faixa Telegram ao vivo gerenciada pelo Convex e faixa Discord ao vivo gerenciada pelo Convex como
jobs paralelos. Verificações agendadas de QA e release passam Matrix `--profile fast`
explicitamente, enquanto o padrão da CLI Matrix e da entrada manual do fluxo de trabalho permanece
`all`; o disparo manual pode fragmentar `all` em jobs `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` e `e2ee-cli`. `OpenClaw Release Checks` executa paridade mais
as faixas rápidas de Matrix e Telegram antes da aprovação de release, usando
`mock-openai/gpt-5.5` para verificações de transporte de release, de modo que permaneçam determinísticas
e evitem a inicialização normal de plugin de provedor. Esses gateways de transporte ao vivo desativam
a busca de memória; o comportamento de memória permanece coberto pelas suítes de paridade de QA.

Fragmentos de mídia ao vivo de release completo usam
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que já tem
`ffmpeg` e `ffprobe`. Fragmentos Docker de modelos/backends ao vivo usam a imagem compartilhada
`ghcr.io/openclaw/openclaw-live-test:<sha>` criada uma vez por commit selecionado,
depois a puxam com `OPENCLAW_SKIP_DOCKER_BUILD=1` em vez de reconstruir
dentro de cada fragmento.

- `pnpm openclaw qa suite`
  - Executa cenários de QA baseados no repositório diretamente no host.
  - Executa vários cenários selecionados em paralelo por padrão com workers de
    Gateway isolados. `qa-channel` usa concorrência 4 por padrão (limitada pela
    contagem de cenários selecionados). Use `--concurrency <count>` para ajustar a contagem de
    workers, ou `--concurrency 1` para a faixa serial mais antiga.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando você
    quiser artefatos sem um código de saída de falha.
  - Suporta modos de provedor `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor de provedor local apoiado por AIMock para cobertura experimental
    de fixtures e mocks de protocolo sem substituir a faixa `mock-openai`
    ciente de cenários.
- `pnpm test:gateway:cpu-scenarios`
  - Executa o benchmark de inicialização do Gateway mais um pequeno pacote de cenários mock do QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e grava um resumo combinado de observação de CPU
    em `.artifacts/gateway-cpu-scenarios/`.
  - Sinaliza por padrão apenas observações sustentadas de CPU quente (`--cpu-core-warn`
    mais `--hot-wall-warn-ms`), então picos curtos de inicialização são registrados como métricas
    sem parecerem a regressão de Gateway preso por vários minutos.
  - Usa artefatos `dist` compilados; execute uma build primeiro quando o checkout ainda não
    tiver saída de runtime fresca.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux descartável do Multipass.
  - Mantém o mesmo comportamento de seleção de cenários que `qa suite` no host.
  - Reutiliza as mesmas flags de seleção de provedor/modelo que `qa suite`.
  - Execuções ao vivo encaminham as entradas de autenticação de QA suportadas que são práticas para o guest:
    chaves de provedor baseadas em env, o caminho de configuração do provedor ao vivo de QA e `CODEX_HOME`
    quando presente.
  - Diretórios de saída devem permanecer sob a raiz do repositório para que o guest possa gravar de volta pelo
    workspace montado.
  - Grava o relatório + resumo normais de QA mais logs do Multipass em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA apoiado por Docker para trabalho de QA no estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Cria um tarball npm a partir do checkout atual, instala-o globalmente no
    Docker, executa onboarding não interativo de chave de API da OpenAI, configura Telegram
    por padrão, verifica se habilitar o plugin instala dependências de runtime sob
    demanda, executa doctor e executa um turno de agente local contra um endpoint OpenAI
    mockado.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para executar a mesma faixa de instalação empacotada
    com Discord.
- `pnpm test:docker:session-runtime-context`
  - Executa um smoke Docker determinístico de aplicativo compilado para transcrições de contexto de runtime
    incorporado. Ele verifica se o contexto de runtime oculto do OpenClaw é persistido como uma
    mensagem customizada sem exibição em vez de vazar para o turno visível do usuário,
    então semeia um JSONL de sessão quebrada afetada e verifica se
    `openclaw doctor --fix` o reescreve para a branch ativa com um backup.
- `pnpm test:docker:npm-telegram-live`
  - Instala um pacote candidato do OpenClaw no Docker, executa onboarding de pacote instalado,
    configura Telegram pela CLI instalada, depois reutiliza a faixa ao vivo de QA do Telegram
    com esse pacote instalado como o Gateway SUT.
  - Usa por padrão `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; defina
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para testar um tarball local resolvido em vez de
    instalar do registro.
  - Usa as mesmas credenciais env do Telegram ou fonte de credenciais Convex que
    `pnpm openclaw qa telegram`. Para automação de CI/release, defina
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` mais
    `OPENCLAW_QA_CONVEX_SITE_URL` e o segredo de função. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e um segredo de função Convex estiverem presentes no CI,
    o wrapper Docker seleciona Convex automaticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` substitui o
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartilhado apenas para esta faixa.
  - GitHub Actions expõe esta faixa como o fluxo de trabalho manual de mantenedor
    `NPM Telegram Beta E2E`. Ele não executa no merge. O fluxo de trabalho usa o ambiente
    `qa-live-shared` e leases de credenciais de CI do Convex.
- GitHub Actions também expõe `Package Acceptance` para prova de produto em execução paralela
  contra um pacote candidato. Ele aceita uma ref confiável, especificação npm publicada,
  URL HTTPS de tarball mais SHA-256, ou artefato de tarball de outra execução, envia
  o `openclaw-current.tgz` normalizado como `package-under-test`, então executa o
  agendador Docker E2E existente com perfis de faixa smoke, package, product, full ou custom.
  Defina `telegram_mode=mock-openai` ou `live-frontier` para executar o
  fluxo de trabalho de QA do Telegram contra o mesmo artefato `package-under-test`.
  - Prova de produto da beta mais recente:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Prova de URL exata de tarball requer um digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- A prova de artefato baixa um artefato tarball de outra execução do Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Empacota e instala a build atual do OpenClaw no Docker, inicia o Gateway
    com o OpenAI configurado e então habilita canais/plugins agrupados por meio
    de edições de configuração.
  - Verifica se a descoberta de configuração deixa ausentes as dependências de
    runtime de plugins não configurados, se a primeira execução configurada do
    Gateway ou do doctor instala sob demanda as dependências de runtime de cada
    plugin agrupado e se uma segunda reinicialização não reinstala dependências
    que já foram ativadas.
  - Também instala uma linha de base npm mais antiga conhecida, habilita o Telegram antes de executar
    `openclaw update --tag <candidate>` e verifica se o doctor pós-atualização
    do candidato repara as dependências de runtime de canais agrupados sem um
    reparo postinstall do lado do harness.
- `pnpm test:parallels:npm-update`
  - Executa o smoke de atualização de instalação empacotada nativa em guests do Parallels. Cada
    plataforma selecionada primeiro instala o pacote de linha de base solicitado, depois executa
    o comando `openclaw update` instalado no mesmo guest e verifica a
    versão instalada, o status da atualização, a prontidão do gateway e uma
    interação de agente local.
  - Use `--platform macos`, `--platform windows` ou `--platform linux` durante
    a iteração em um guest. Use `--json` para o caminho do artefato de resumo e
    o status por lane.
  - A lane do OpenAI usa `openai/gpt-5.5` para a prova de interação de agente
    live por padrão. Passe `--model <provider/model>` ou defina
    `OPENCLAW_PARALLELS_OPENAI_MODEL` ao validar deliberadamente outro
    modelo OpenAI.
  - Envolva execuções locais longas em um timeout do host para que travamentos
    de transporte do Parallels não consumam o restante da janela de testes:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - O script grava logs de lanes aninhadas em `/tmp/openclaw-parallels-npm-update.*`.
    Inspecione `windows-update.log`, `macos-update.log` ou `linux-update.log`
    antes de presumir que o wrapper externo travou.
  - A atualização no Windows pode passar de 10 a 15 minutos no reparo pós-atualização
    do doctor/dependências de runtime em um guest frio; isso ainda é saudável quando o log
    de depuração npm aninhado está avançando.
  - Não execute este wrapper agregado em paralelo com lanes individuais de smoke
    macOS, Windows ou Linux do Parallels. Elas compartilham estado de VM e podem colidir na
    restauração de snapshot, no serviço de pacotes ou no estado do gateway do guest.
  - A prova pós-atualização executa a superfície normal de plugins agrupados porque
    fachadas de capacidade como fala, geração de imagens e entendimento de mídia
    são carregadas por meio de APIs de runtime agrupadas mesmo quando a interação
    do agente em si verifica apenas uma resposta de texto simples.

- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor local do provedor AIMock para testes diretos de smoke
    do protocolo.
- `pnpm openclaw qa matrix`
  - Executa a lane live de QA do Matrix contra um homeserver Tuwunel descartável baseado em Docker. Somente checkout de código-fonte — instalações empacotadas não distribuem `qa-lab`.
  - CLI completa, catálogo de perfis/cenários, variáveis de ambiente e layout de artefatos: [QA do Matrix](/pt-BR/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Executa a lane live de QA do Telegram contra um grupo privado real usando os tokens do bot driver e do bot SUT do env.
  - Requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O id do grupo deve ser o id numérico do chat do Telegram.
  - Aceita `--credential-source convex` para credenciais compartilhadas em pool. Use o modo env por padrão ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases em pool.
  - Sai com valor diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando você
    quiser artefatos sem um código de saída com falha.
  - Requer dois bots distintos no mesmo grupo privado, com o bot SUT expondo um nome de usuário do Telegram.
  - Para observação estável de bot para bot, habilite o Modo de Comunicação Bot-to-Bot no `@BotFather` para ambos os bots e garanta que o bot driver consiga observar o tráfego de bots do grupo.
  - Grava um relatório de QA do Telegram, resumo e artefato de mensagens observadas em `.artifacts/qa-e2e/...`. Cenários de resposta incluem RTT desde a solicitação de envio do driver até a resposta SUT observada.

Lanes de transporte live compartilham um contrato padrão para que novos transportes não divirjam; a matriz de cobertura por lane fica em [visão geral de QA → Cobertura de transporte live](/pt-BR/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` é a suíte sintética ampla e não faz parte dessa matriz.

### Credenciais compartilhadas do Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) é habilitado para
`openclaw qa telegram`, o QA lab adquire um lease exclusivo de um pool baseado em Convex, envia heartbeats
para esse lease enquanto a lane está em execução e libera o lease no desligamento.

Scaffold de projeto Convex de referência:

- `qa/convex-credential-broker/`

Variáveis de ambiente obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo, `https://your-deployment.convex.site`)
- Um segredo para o papel selecionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção do papel da credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão do env: `OPENCLAW_QA_CREDENTIAL_ROLE` (o padrão é `ci` em CI, `maintainer` caso contrário)

Variáveis de ambiente opcionais:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (padrão `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (padrão `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (padrão `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (padrão `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (padrão `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreamento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback para desenvolvimento somente local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` na operação normal.

Comandos administrativos de mantenedor (adicionar/remover/listar pool) requerem
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` especificamente.

Helpers de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `doctor` antes de execuções live para verificar a URL do site Convex, segredos do broker,
prefixo de endpoint, timeout HTTP e acessibilidade de admin/list sem imprimir
valores secretos. Use `--json` para saída legível por máquina em scripts e
utilitários de CI.

Contrato de endpoint padrão (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Solicitação: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sucesso: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esgotado/repetível: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
  - Proteção de lease ativo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (somente segredo de mantenedor)
  - Solicitação: `{ kind?, status?, includePayload?, limit? }`
  - Sucesso: `{ status: "ok", credentials, count }`

Formato de payload para o tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve ser uma string de id numérico de chat do Telegram.
- `admin/add` valida esse formato para `kind: "telegram"` e rejeita payloads malformados.

### Adicionando um canal ao QA

A arquitetura e os nomes de helpers de cenário para novos adaptadores de canal ficam em [visão geral de QA → Adicionando um canal](/pt-BR/concepts/qa-e2e-automation#adding-a-channel). O requisito mínimo: implementar o runner de transporte no seam compartilhado do host `qa-lab`, declarar `qaRunners` no manifesto do plugin, montar como `openclaw qa <runner>` e criar cenários em `qa/scenarios/`.

## Suítes de teste (o que executa onde)

Pense nas suítes como “realismo crescente” (e maior instabilidade/custo):

### Unitário / integração (padrão)

- Comando: `pnpm test`
- Configuração: execuções sem alvo usam o conjunto de shards `vitest.full-*.config.ts` e podem expandir shards multiprojeto em configurações por projeto para agendamento paralelo
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts` e `test/**/*.test.ts`; testes unitários de UI executam no shard dedicado `unit-ui`
- Escopo:
  - Testes unitários puros
  - Testes de integração em processo (autenticação do gateway, roteamento, ferramentas, parsing, configuração)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Executa em CI
  - Não requer chaves reais
  - Deve ser rápido e estável
  - Testes de resolvedor e loader de superfície pública devem provar o comportamento amplo de fallback de `api.js` e
    `runtime-api.js` com fixtures minúsculos de plugin gerados, não
    APIs de código-fonte de plugins agrupados reais. Loads de API de plugins reais pertencem às
    suítes de contrato/integração pertencentes aos plugins.

<AccordionGroup>
  <Accordion title="Projetos, shards e lanes com escopo">

    - `pnpm test` sem alvo executa doze configurações de shards menores (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um processo gigante do projeto raiz nativo. Isso reduz o pico de RSS em máquinas carregadas e evita que o trabalho de resposta automática/Plugin deixe suítes não relacionadas sem recursos.
    - `pnpm test --watch` ainda usa o grafo de projeto raiz nativo `vitest.config.ts`, porque um loop de observação com múltiplos shards não é prático.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` roteiam alvos explícitos de arquivo/diretório primeiro por lanes com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo completo de inicialização do projeto raiz.
    - `pnpm test:changed` expande caminhos git alterados para lanes baratas com escopo por padrão: edições diretas de testes, arquivos irmãos `*.test.ts`, mapeamentos explícitos de código-fonte e dependentes locais do grafo de imports. Edições de configuração/setup/pacote não executam testes amplos, a menos que você use explicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` é o gate normal de verificação local inteligente para trabalho restrito. Ele classifica o diff em core, testes de core, plugins, testes de plugins, apps, docs, metadados de release, ferramentas live de Docker e tooling, depois executa os comandos correspondentes de typecheck, lint e guardas. Ele não executa testes Vitest; chame `pnpm test:changed` ou `pnpm test <target>` explícito para comprovação de teste. Aumentos de versão somente de metadados de release executam verificações direcionadas de versão/configuração/dependência raiz, com um guarda que rejeita alterações de pacote fora do campo de versão de nível superior.
    - Edições do harness live Docker ACP executam verificações focadas: sintaxe de shell para os scripts de autenticação live Docker e uma simulação do agendador live Docker. Alterações em `package.json` são incluídas somente quando o diff é limitado a `scripts["test:docker:live-*"]`; edições de dependências, exports, versão e outras superfícies de pacote ainda usam os guardas mais amplos.
    - Testes unitários leves de import de agentes, comandos, plugins, auxiliares de resposta automática, `plugin-sdk` e áreas semelhantes de utilitários puros passam pela lane `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos com estado/pesados de runtime permanecem nas lanes existentes.
    - Arquivos-fonte auxiliares selecionados de `plugin-sdk` e `commands` também mapeiam execuções em modo alterado para testes irmãos explícitos nessas lanes leves, então edições auxiliares evitam executar novamente a suíte pesada completa desse diretório.
    - `auto-reply` tem buckets dedicados para auxiliares de core de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. O CI ainda divide a subárvore de resposta em shards de agent-runner, dispatch e comandos/roteamento de estado para que um bucket pesado em imports não concentre toda a cauda de Node.
    - O CI normal de PR/main intencionalmente ignora a varredura em lote de plugins e o shard `agentic-plugins` somente de release. A Validação Completa de Release dispara o workflow filho separado `Plugin Prerelease` para essas suítes pesadas em plugins em candidatos a release.

  </Accordion>

  <Accordion title="Cobertura do runner embutido">

    - Quando você alterar entradas de descoberta de ferramentas de mensagem ou contexto de runtime de Compaction,
      mantenha os dois níveis de cobertura.
    - Adicione regressões auxiliares focadas para limites puros de roteamento e normalização.
    - Mantenha saudáveis as suítes de integração do runner embutido:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Essas suítes verificam que ids com escopo e o comportamento de Compaction ainda fluem
      pelos caminhos reais de `run.ts` / `compact.ts`; testes apenas de auxiliares
      não são um substituto suficiente para esses caminhos de integração.

  </Accordion>

  <Accordion title="Padrões de pool e isolamento do Vitest">

    - A configuração base do Vitest usa `threads` por padrão.
    - A configuração compartilhada do Vitest fixa `isolate: false` e usa o
      runner não isolado nos projetos raiz, nas configurações e2e e live.
    - A lane de UI raiz mantém seu setup `jsdom` e otimizador, mas também roda no
      runner compartilhado não isolado.
    - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false`
      da configuração compartilhada do Vitest.
    - `scripts/run-vitest.mjs` adiciona `--no-maglev` por padrão para processos
      Node filhos do Vitest para reduzir churn de compilação do V8 durante grandes execuções locais.
      Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar com o comportamento padrão do V8.

  </Accordion>

  <Accordion title="Iteração local rápida">

    - `pnpm changed:lanes` mostra quais lanes arquiteturais um diff aciona.
    - O hook de pre-commit é somente de formatação. Ele recoloca em stage os arquivos formatados e
      não executa lint, typecheck nem testes.
    - Execute `pnpm check:changed` explicitamente antes do handoff ou push quando você
      precisar do gate inteligente de verificação local.
    - `pnpm test:changed` roteia por lanes baratas com escopo por padrão. Use
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando o agente
      decidir que uma edição de harness, configuração, pacote ou contrato realmente precisa de cobertura Vitest mais ampla.
    - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento,
      apenas com um limite maior de workers.
    - O autoescalonamento de workers locais é intencionalmente conservador e reduz a carga
      quando a média de carga do host já está alta, então múltiplas execuções Vitest simultâneas
      causam menos impacto por padrão.
    - A configuração base do Vitest marca os projetos/arquivos de configuração como
      `forceRerunTriggers` para que reexecuções em modo alterado continuem corretas quando a fiação dos testes muda.
    - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado em hosts compatíveis;
      defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se quiser
      um local de cache explícito para profiling direto.

  </Accordion>

  <Accordion title="Debug de performance">

    - `pnpm test:perf:imports` habilita o relatório de duração de imports do Vitest mais
      a saída de detalhamento de imports.
    - `pnpm test:perf:imports:changed` aplica o mesmo modo de profiling a
      arquivos alterados desde `origin/main`.
    - Dados de tempo dos shards são gravados em `.artifacts/vitest-shard-timings.json`.
      Execuções de configuração inteira usam o caminho da configuração como chave; shards de CI com padrão de inclusão
      acrescentam o nome do shard para que shards filtrados possam ser acompanhados separadamente.
    - Quando um teste quente ainda gasta a maior parte do tempo em imports de inicialização,
      mantenha dependências pesadas atrás de uma borda local estreita `*.runtime.ts` e
      faça mock dessa borda diretamente em vez de importar profundamente auxiliares de runtime apenas
      para passá-los por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara o
      `test:changed` roteado com o caminho nativo do projeto raiz para esse diff commitado
      e imprime tempo total mais RSS máximo no macOS.
    - `pnpm test:perf:changed:bench -- --worktree` faz benchmark da árvore suja atual
      roteando a lista de arquivos alterados por
      `scripts/test-projects.mjs` e pela configuração raiz do Vitest.
    - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para
      overhead de inicialização e transform do Vitest/Vite.
    - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do runner para a
      suíte unitária com paralelismo por arquivo desabilitado.

  </Accordion>
</AccordionGroup>

### Estabilidade (gateway)

- Comando: `pnpm test:stability:gateway`
- Configuração: `vitest.gateway.config.ts`, forçada para um worker
- Escopo:
  - Inicia um Gateway real em loopback com diagnósticos habilitados por padrão
  - Conduz churn sintético de mensagem de gateway, memória e payload grande pelo caminho de eventos de diagnóstico
  - Consulta `diagnostics.stability` via RPC WS do Gateway
  - Cobre auxiliares de persistência do pacote de estabilidade de diagnóstico
  - Confirma que o gravador permanece limitado, amostras sintéticas de RSS ficam abaixo do orçamento de pressão e profundidades de fila por sessão drenam de volta para zero
- Expectativas:
  - Seguro para CI e sem chaves
  - Lane estreita para acompanhamento de regressão de estabilidade, não um substituto para a suíte completa de Gateway

### E2E (smoke de gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e testes E2E de plugins incluídos em `extensions/`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, correspondendo ao restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Executa em modo silencioso por padrão para reduzir overhead de E/S do console.
- Overrides úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a contagem de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reabilitar saída detalhada do console.
- Escopo:
  - Comportamento end-to-end de gateway multi-instância
  - Superfícies WebSocket/HTTP, pareamento de node e networking mais pesado
- Expectativas:
  - Executa no CI (quando habilitado no pipeline)
  - Não exige chaves reais
  - Mais partes móveis do que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `extensions/openshell/src/backend.e2e.test.ts`
- Escopo:
  - Inicia um gateway OpenShell isolado no host via Docker
  - Cria um sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell da OpenClaw sobre `sandbox ssh-config` real + execução SSH
  - Verifica o comportamento de sistema de arquivos remoto-canônico pela ponte fs do sandbox
- Expectativas:
  - Somente opt-in; não faz parte da execução padrão de `pnpm test:e2e`
  - Exige uma CLI `openshell` local mais um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados, depois destrói o gateway e o sandbox de teste
- Overrides úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário de CLI não padrão ou script wrapper

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e testes live de plugins incluídos em `extensions/`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Este provedor/modelo realmente funciona _hoje_ com credenciais reais?”
  - Capturar mudanças de formato de provedor, particularidades de chamadas de ferramentas, problemas de autenticação e comportamento de rate limit
- Expectativas:
  - Não é estável para CI por design (redes reais, políticas reais de provedores, cotas, indisponibilidades)
  - Custa dinheiro / usa limites de taxa
  - Prefira executar subconjuntos restritos em vez de “tudo”
- Execuções live carregam `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de config/auth para um home de teste temporário para que fixtures unitárias não possam alterar seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` somente quando você intencionalmente precisar que testes live usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...`, mas suprime o aviso extra de `~/.profile` e silencia logs de bootstrap do gateway/ruído de Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser os logs completos de inicialização de volta.
- Rotação de chaves de API (específica por provedor): defina `*_API_KEYS` com formato separado por vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou override por live via `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de rate limit.
- Saída de progresso/Heartbeat:
  - As suítes live agora emitem linhas de progresso para stderr para que chamadas longas a provedores fiquem visivelmente ativas mesmo quando a captura de console do Vitest está silenciosa.
  - `vitest.live.config.ts` desabilita a interceptação de console do Vitest para que linhas de progresso de provedor/gateway sejam transmitidas imediatamente durante execuções live.
  - Ajuste Heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste Heartbeats de gateway/probe com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Edição de lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se você alterou muita coisa)
- Mexendo em rede do Gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando “meu bot está fora do ar” / falhas específicas de provedor / chamada de ferramentas: execute um `pnpm test:live` restrito

## Testes live (que tocam na rede)

Para a matriz de modelos live, smokes de backend da CLI, smokes de ACP, harness do servidor de app do Codex e todos os testes live de provedores de mídia (Deepgram, BytePlus, ComfyUI, imagem, música, vídeo, harness de mídia) — além do tratamento de credenciais para execuções live — consulte [Testing — live suites](/pt-BR/help/testing-live).

## Runners Docker (verificações opcionais de "funciona no Linux")

Estes runners Docker se dividem em dois grupos:

- Runners de modelos live: `test:docker:live-models` e `test:docker:live-gateway` executam apenas o arquivo live de chave de perfil correspondente dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório local de configuração e o workspace (e carregando `~/.profile`, se montado). Os pontos de entrada locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Runners live Docker usam por padrão um limite de smoke menor para manter uma varredura Docker completa prática:
  `test:docker:live-models` usa `OPENCLAW_LIVE_MAX_MODELS=12` por padrão, e
  `test:docker:live-gateway` usa `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` por padrão. Sobrescreva essas variáveis de ambiente quando você
  quiser explicitamente a varredura exaustiva maior.
- `test:docker:all` cria a imagem Docker live uma vez via `test:docker:live-build`, empacota o OpenClaw uma vez como um tarball npm por meio de `scripts/package-openclaw-for-docker.mjs` e então cria/reutiliza duas imagens `scripts/e2e/Dockerfile`. A imagem básica é apenas o runner Node/Git para vias de instalação/atualização/dependências de Plugin; essas vias montam o tarball pré-criado. A imagem funcional instala o mesmo tarball em `/app` para vias de funcionalidade do app construído. As definições das vias Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`; a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` executa o plano selecionado. O agregado usa um escalonador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla os slots de processo, enquanto limites de recursos impedem que vias pesadas de live, instalação npm e múltiplos serviços iniciem todas de uma vez. Se uma única via for mais pesada que os limites ativos, o escalonador ainda pode iniciá-la quando o pool estiver vazio e então a mantém rodando sozinha até haver capacidade novamente. Os padrões são 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajuste `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` apenas quando o host Docker tiver mais folga. O runner executa um preflight Docker por padrão, remove contêineres E2E antigos do OpenClaw, imprime status a cada 30 segundos, armazena tempos de vias bem-sucedidas em `.artifacts/docker-tests/lane-timings.json` e usa esses tempos para iniciar vias mais longas primeiro em execuções posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir o manifesto ponderado de vias sem criar nem executar Docker, ou `node scripts/test-docker-all.mjs --plan-json` para imprimir o plano de CI para vias selecionadas, necessidades de pacote/imagem e credenciais.
- `Package Acceptance` é o gate de pacote nativo do GitHub para "este tarball instalável funciona como produto?" Ele resolve um pacote candidato a partir de `source=npm`, `source=ref`, `source=url` ou `source=artifact`, envia-o como `package-under-test` e então executa as vias Docker E2E reutilizáveis contra esse tarball exato em vez de reempacotar a ref selecionada. `workflow_ref` seleciona os scripts confiáveis de workflow/harness, enquanto `package_ref` seleciona o commit/branch/tag de origem a empacotar quando `source=ref`; isso permite que a lógica de aceitação atual valide commits confiáveis mais antigos. Os perfis são ordenados por abrangência: `smoke` é instalação/canal/agente rápidos mais Gateway/configuração, `package` é o contrato de pacote/atualização/Plugin mais a fixture keyless upgrade-survivor e a substituição nativa padrão para a maior parte da cobertura de pacote/atualização do Parallels, `product` adiciona canais MCP, limpeza de cron/subagente, pesquisa web da OpenAI e OpenWebUI, e `full` executa os blocos Docker do caminho de release com OpenWebUI. A validação de release executa um delta de pacote personalizado (`bundled-channel-deps-compat plugins-offline`) mais QA de pacote Telegram porque os blocos Docker do caminho de release já cobrem as vias sobrepostas de pacote/atualização/Plugin. Comandos direcionados de reexecução Docker no GitHub gerados a partir de artefatos incluem o artefato de pacote anterior e entradas de imagem preparadas quando disponíveis, para que vias com falha possam evitar recriar o pacote e as imagens.
- Verificações de build e release executam `scripts/check-cli-bootstrap-imports.mjs` após o tsdown. A proteção percorre o grafo construído estático a partir de `dist/entry.js` e `dist/cli/run-main.js` e falha se a inicialização antes do despacho importar dependências de pacote como Commander, UI de prompt, undici ou logging antes do despacho do comando; ela também mantém o bloco de execução do Gateway empacotado dentro do orçamento e rejeita importações estáticas de caminhos frios conhecidos do Gateway. O smoke da CLI empacotada também cobre ajuda raiz, ajuda de onboarding, ajuda do doctor, status, schema de configuração e um comando de lista de modelos.
- A compatibilidade legada do Package Acceptance é limitada a `2026.4.25` (`2026.4.25-beta.*` incluído). Até esse ponto de corte, o harness tolera apenas lacunas de metadados de pacote enviado: entradas omitidas de inventário privado de QA, ausência de `gateway install --wrapper`, arquivos de patch ausentes na fixture git derivada do tarball, ausência de `update.channel` persistido, locais legados de registros de instalação de Plugin, ausência de persistência de registros de instalação do marketplace e migração de metadados de configuração durante `plugins update`. Para pacotes após `2026.4.25`, esses caminhos são falhas estritas.
- Runners de smoke de contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` inicializam um ou mais contêineres reais e verificam caminhos de integração de nível mais alto.

Os runners Docker de modelos live também montam por bind apenas os diretórios home de autenticação de CLI necessários (ou todos os compatíveis quando a execução não está restrita) e então os copiam para o home do contêiner antes da execução, para que o OAuth de CLI externa possa atualizar tokens sem modificar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cobre Claude, Codex e Gemini por padrão, com cobertura estrita de Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke do backend da CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke do harness do servidor de app do Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desenvolvimento: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke de observabilidade: `pnpm qa:otel:smoke` é uma lane privada de checkout de código-fonte para QA. Intencionalmente, ela não faz parte das lanes de release Docker do pacote porque o tarball npm omite o QA Lab.
- Smoke live do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de onboarding/canal/agente do tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala o tarball empacotado do OpenClaw globalmente no Docker, configura OpenAI via onboarding com referência de env mais Telegram por padrão, verifica se o doctor reparou as dependências de runtime do plugin ativado e executa uma rodada de agente OpenAI mockada. Reutilize um tarball pré-compilado com `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pule a recompilação no host com `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ou altere o canal com `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke de troca de canal de atualização: `pnpm test:docker:update-channel-switch` instala o tarball empacotado do OpenClaw globalmente no Docker, troca de pacote `stable` para git `dev`, verifica o canal persistido e o funcionamento pós-atualização do plugin, depois troca de volta para pacote `stable` e verifica o status de atualização.
- Smoke de sobrevivência a upgrade: `pnpm test:docker:upgrade-survivor` instala o tarball empacotado do OpenClaw sobre uma fixture suja de usuário antigo com agentes, configuração de canal, allowlists de plugins, estado obsoleto de dependências de runtime de plugins e arquivos existentes de workspace/sessão. Ele executa atualização de pacote mais doctor não interativo sem chaves live de provedor ou canal, depois inicia um Gateway de loopback e verifica preservação de configuração/estado mais orçamentos de inicialização/status.
- Smoke de contexto de runtime de sessão: `pnpm test:docker:session-runtime-context` verifica a persistência oculta de transcrição do contexto de runtime mais o reparo pelo doctor de branches duplicados afetados de reescrita de prompt.
- Smoke de instalação global com Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empacota a árvore atual, instala com `bun install -g` em um home isolado e verifica se `openclaw infer image providers --json` retorna provedores de imagem incluídos em vez de travar. Reutilize um tarball pré-compilado com `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pule a build no host com `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ou copie `dist/` de uma imagem Docker compilada com `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker do instalador: `bash scripts/test-install-sh-docker.sh` compartilha um único cache npm entre seus contêineres root, update e direct-npm. O smoke de update usa npm `latest` por padrão como baseline estável antes de atualizar para o tarball candidato. Sobrescreva com `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente ou com o input `update_baseline_version` do workflow Install Smoke no GitHub. As verificações de instalador não root mantêm um cache npm isolado para que entradas de cache pertencentes ao root não mascarem o comportamento de instalação local do usuário. Defina `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar o cache root/update/direct-npm em reexecuções locais.
- O CI Install Smoke pula a atualização global direct-npm duplicada com `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; execute o script localmente sem essa env quando a cobertura direta de `npm install -g` for necessária.
- Smoke da CLI de exclusão de workspace compartilhado por agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila a imagem do Dockerfile raiz por padrão, semeia dois agentes com um workspace em um home de contêiner isolado, executa `agents delete --json` e verifica JSON válido mais comportamento de workspace retido. Reutilize a imagem install-smoke com `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Rede do Gateway (dois contêineres, autenticação WS + saúde): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke de snapshot de CDP do navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila a imagem E2E de origem mais uma camada Chromium, inicia o Chromium com CDP bruto, executa `browser doctor --deep` e verifica se os snapshots de função do CDP cobrem URLs de links, clicáveis promovidos por cursor, referências de iframe e metadados de frame.
- Regressão de raciocínio mínimo do OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) executa um servidor OpenAI mockado pelo Gateway, verifica se `web_search` aumenta `reasoning.effort` de `minimal` para `low`, depois força a rejeição do schema do provedor e confere se o detalhe bruto aparece nos logs do Gateway.
- Ponte de canais MCP (Gateway semeado + ponte stdio + smoke de frame de notificação bruto do Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Ferramentas MCP do pacote Pi (servidor MCP stdio real + smoke de allow/deny do perfil Pi embutido): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpeza MCP de Cron/subagente (Gateway real + encerramento de processo filho MCP stdio após execuções isoladas de cron e subagente one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalação, instalação/desinstalação kitchen-sink do ClawHub, atualizações de marketplace e habilitação/inspeção do pacote Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Defina `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para pular o bloco ClawHub, ou sobrescreva o par padrão pacote/runtime kitchen-sink com `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sem `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, o teste usa um servidor local hermético de fixture do ClawHub.
- Smoke de atualização de plugin sem alterações: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de metadados de recarregamento de config: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dependências de runtime de plugins incluídos: `pnpm test:docker:bundled-channel-deps` compila uma pequena imagem runner Docker por padrão, compila e empacota o OpenClaw uma vez no host e então monta esse tarball em cada cenário de instalação Linux. Reutilize a imagem com `OPENCLAW_SKIP_DOCKER_BUILD=1`, pule a recompilação no host após uma build local recente com `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` ou aponte para um tarball existente com `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. O agregado Docker completo e os chunks de bundled-channel do caminho de release pré-empacotam esse tarball uma vez, depois fragmentam as verificações de canais incluídos em lanes independentes, incluindo lanes de atualização separadas para Telegram, Discord, Slack, Feishu, memory-lancedb e ACPX. Os chunks de release separam smokes de canal, alvos de atualização e contratos de setup/runtime em `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` e `bundled-channels-contracts`; o chunk agregado `bundled-channels` permanece disponível para reexecuções manuais. O workflow de release também separa chunks de instalador de provedor e chunks de instalação/desinstalação de plugins incluídos; os chunks legados `package-update`, `plugins-runtime` e `plugins-integrations` permanecem como aliases agregados para reexecuções manuais. Use `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` para restringir a matriz de canais ao executar a lane incluída diretamente, ou `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` para restringir o cenário de atualização. Execuções Docker por cenário usam `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s` por padrão; o cenário de atualização com múltiplos alvos usa `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s` por padrão. A lane também verifica se `channels.<id>.enabled=false` e `plugins.entries.<id>.enabled=false` suprimem o reparo de dependências de runtime pelo doctor.
- Restrinja as dependências de runtime de plugins incluídos durante a iteração desabilitando cenários não relacionados, por exemplo:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Para pré-compilar e reutilizar manualmente a imagem funcional compartilhada:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Sobrescritas de imagem específicas de suíte, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, ainda prevalecem quando definidas. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` aponta para uma imagem remota compartilhada, os scripts fazem pull dela se ela ainda não estiver local. Os testes Docker de QR e instalador mantêm seus próprios Dockerfiles porque validam comportamento de pacote/instalação em vez do runtime compartilhado do app compilado.

Os executores Docker de modelos live também montam o checkout atual como somente leitura e
o preparam em um diretório de trabalho temporário dentro do contêiner. Isso mantém a imagem de runtime
enxuta, ainda executando o Vitest contra exatamente o seu código-fonte/configuração local.
A etapa de preparação ignora caches grandes apenas locais e saídas de build de apps, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, e diretórios de saída `.build` locais de apps ou
do Gradle, para que execuções live no Docker não passem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que sondagens live do gateway não iniciem
trabalhadores de canal reais do Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, então repasse
`OPENCLAW_LIVE_GATEWAY_*` também quando precisar restringir ou excluir a cobertura live
do gateway dessa lane Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível mais alto: ele inicia um
contêiner do gateway OpenClaw com os endpoints HTTP compatíveis com OpenAI habilitados,
inicia um contêiner fixado do Open WebUI contra esse gateway, faz login pelo
Open WebUI, verifica se `/api/models` expõe `openclaw/default` e então envia uma
solicitação real de chat pelo proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser perceptivelmente mais lenta porque o Docker pode precisar baixar a
imagem do Open WebUI e o Open WebUI pode precisar concluir sua própria configuração de inicialização fria.
Essa lane espera uma chave de modelo live utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a principal forma de fornecê-la em execuções Dockerizadas.
Execuções bem-sucedidas imprimem um pequeno payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real do Telegram, Discord ou iMessage. Ele inicializa um contêiner Gateway
com dados semeados, inicia um segundo contêiner que dispara `openclaw mcp serve`, e então
verifica descoberta de conversas roteadas, leituras de transcrições, metadados de anexos,
comportamento da fila de eventos live, roteamento de envio de saída e notificações de canal +
permissão no estilo Claude pela ponte MCP stdio real. A verificação de notificação
inspeciona diretamente os frames MCP stdio brutos, para que o smoke valide o que a
ponte realmente emite, não apenas o que um SDK de cliente específico acaba expondo.
`test:docker:pi-bundle-mcp-tools` é determinístico e não precisa de uma chave de modelo live.
Ele compila a imagem Docker do repositório, inicia um servidor de sondagem MCP stdio real
dentro do contêiner, materializa esse servidor pelo runtime MCP do bundle Pi embutido,
executa a ferramenta e então verifica se `coding` e `messaging` mantêm
ferramentas `bundle-mcp`, enquanto `minimal` e `tools.deny: ["bundle-mcp"]` as filtram.
`test:docker:cron-mcp-cleanup` é determinístico e não precisa de uma chave de modelo live.
Ele inicia um Gateway semeado com um servidor de sondagem MCP stdio real, executa um
turno cron isolado e um turno filho one-shot de `/subagents spawn`, e então verifica
se o processo filho MCP encerra após cada execução.

Smoke manual de thread ACP em linguagem simples (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de regressão/depuração. Ele pode ser necessário novamente para validação de roteamento de threads ACP, então não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes de executar testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de configuração/workspace e sem montagens externas de autenticação de CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações de CLI em cache dentro do Docker
- Diretórios/arquivos externos de autenticação de CLI sob `$HOME` são montados como somente leitura em `/host-auth...` e depois copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções restringidas por provedor montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescreva manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em reexecuções que não precisam de rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do armazenamento de perfis (não do ambiente)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescrever o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescrever a tag fixada da imagem do Open WebUI

## Sanidade da documentação

Execute verificações de documentação após edições em docs: `pnpm check:docs`.
Execute a validação completa de âncoras Mintlify quando também precisar de verificações de cabeçalhos na página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem provedores reais:

- Chamada de ferramentas do Gateway (OpenAI simulado, gateway real + loop de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do Gateway (WS `wizard.start`/`wizard.next`, grava configuração + autenticação aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evals de confiabilidade de agente (skills)

Já temos alguns testes seguros para CI que se comportam como “evals de confiabilidade de agente”:

- Chamada de ferramentas simulada pelo gateway real + loop de agente (`src/gateway/gateway.test.ts`).
- Fluxos de assistente de ponta a ponta que validam a ligação de sessão e os efeitos de configuração (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (veja [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills são listadas no prompt, o agente escolhe a Skill certa (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes do uso e segue etapas/argumentos obrigatórios?
- **Contratos de fluxo de trabalho:** cenários multi-turno que validam ordem de ferramentas, continuidade do histórico da sessão e limites do sandbox.

Evals futuros devem permanecer primeiro determinísticos:

- Um executor de cenários usando provedores simulados para validar chamadas de ferramentas + ordem, leituras de arquivos de Skill e ligação de sessão.
- Uma pequena suíte de cenários focados em Skills (usar vs evitar, controles, injeção de prompt).
- Evals live opcionais (opt-in, controlados por env) somente depois que a suíte segura para CI estiver pronta.

## Testes de contrato (formato de plugin e canal)

Testes de contrato verificam que cada plugin e canal registrado está em conformidade com seu
contrato de interface. Eles iteram por todos os plugins descobertos e executam uma suíte de
asserções de formato e comportamento. A lane unitária padrão de `pnpm test` intencionalmente
ignora esses arquivos compartilhados de ponto de integração e smoke; execute os comandos de contrato explicitamente
quando tocar superfícies compartilhadas de canal ou provedor.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Apenas contratos de canal: `pnpm test:contracts:channels`
- Apenas contratos de provedor: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Formato básico do plugin (id, nome, capacidades)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de ligação de sessão
- **outbound-payload** - Estrutura de payload de mensagem
- **inbound** - Tratamento de mensagem de entrada
- **actions** - Manipuladores de ação de canal
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista
- **group-policy** - Aplicação de política de grupo

### Contratos de status de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondagens de status de canal
- **registry** - Formato do registro de plugins

### Contratos de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de fluxo de autenticação
- **auth-choice** - Escolha/seleção de autenticação
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de plugins
- **loader** - Carregamento de plugins
- **runtime** - Runtime de provedor
- **shape** - Formato/interface do plugin
- **wizard** - Assistente de configuração

### Quando executar

- Depois de alterar exports ou subpaths de plugin-sdk
- Depois de adicionar ou modificar um plugin de canal ou provedor
- Depois de refatorar registro ou descoberta de plugins

Testes de contrato executam no CI e não exigem chaves de API reais.

## Adicionando regressões (orientação)

Quando você corrigir um problema de provedor/modelo descoberto live:

- Adicione uma regressão segura para CI, se possível (provedor simulado/stub ou captura da transformação exata do formato da solicitação)
- Se for inerentemente apenas live (limites de taxa, políticas de autenticação), mantenha o teste live restrito e opt-in via variáveis de ambiente
- Prefira mirar na menor camada que captura o bug:
  - bug de conversão/replay de solicitação do provedor → teste direto de modelos
  - bug de sessão/histórico/pipeline de ferramentas do gateway → smoke live do gateway ou teste mock do gateway seguro para CI
- Proteção de travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo amostrado por classe de SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`) e então afirma que ids de exec com segmentos de travessia são rejeitados.
  - Se você adicionar uma nova família de alvos SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de alvo não classificados para que novas classes não possam ser ignoradas silenciosamente.

## Relacionado

- [Testes live](/pt-BR/help/testing-live)
- [CI](/pt-BR/ci)
