---
read_when:
    - Adição ou modificação de Skills
    - Alteração de restrições, listas de permissões ou regras de carregamento de Skills
    - Entendendo a precedência de Skills e o comportamento de snapshots
sidebarTitle: Skills
summary: As Skills ensinam seu agente a usar ferramentas. Saiba como elas são carregadas, como funciona a precedência e como configurar restrições, listas de permissões e injeção de variáveis de ambiente.
title: Skills
x-i18n:
    generated_at: "2026-07-12T00:27:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills são arquivos de instruções em Markdown que ensinam ao agente como e quando usar
ferramentas. Cada Skill fica em um diretório que contém um arquivo `SKILL.md` com
frontmatter YAML e um corpo em Markdown. O OpenClaw carrega as Skills incluídas e
quaisquer substituições locais, filtrando-as durante o carregamento com base no
ambiente, na configuração e na presença de binários.

<CardGroup cols={2}>
  <Card title="Criar Skills" href="/pt-BR/tools/creating-skills" icon="hammer">
    Crie e teste uma Skill personalizada do zero.
  </Card>
  <Card title="Oficina de Skills" href="/pt-BR/tools/skill-workshop" icon="flask">
    Revise e aprove propostas de Skills elaboradas pelo agente.
  </Card>
  <Card title="Configuração de Skills" href="/pt-BR/tools/skills-config" icon="gear">
    Esquema completo de configuração `skills.*` e listas de permissões de agentes.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Explore e instale Skills da comunidade.
  </Card>
</CardGroup>

## Ordem de carregamento

O OpenClaw carrega a partir destas fontes, **da maior para a menor precedência**. Quando o mesmo
nome de Skill aparece em vários locais, a fonte de maior precedência prevalece.

| Prioridade   | Fonte                      | Caminho                                 |
| ------------ | -------------------------- | --------------------------------------- |
| 1 — maior    | Skills do espaço de trabalho | `<workspace>/skills`                  |
| 2            | Skills do agente do projeto | `<workspace>/.agents/skills`           |
| 3            | Skills pessoais do agente  | `~/.agents/skills`                      |
| 4            | Skills gerenciadas/locais  | `~/.openclaw/skills`                    |
| 5            | Skills incluídas           | fornecidas com a instalação             |
| 6 — menor    | Diretórios adicionais      | `skills.load.extraDirs` + Skills de Plugins |

As raízes de Skills aceitam layouts agrupados. O OpenClaw descobre uma Skill sempre que
`SKILL.md` aparece em qualquer local dentro de uma raiz configurada (com até 6 níveis de profundidade):

```text
<workspace>/skills/research/SKILL.md          ✓ encontrada como "research"
<workspace>/skills/personal/research/SKILL.md ✓ também encontrada como "research"
```

O caminho da pasta serve apenas para organização. O nome e o comando com barra da Skill
vêm do campo `name` do frontmatter (ou do nome do diretório quando `name` está
ausente). As listas de permissões de agentes (abaixo) também correspondem a esse `name`.

<Note>
  O diretório nativo `$CODEX_HOME/skills` da Codex CLI **não** é uma raiz de
  Skills do OpenClaw. Use `openclaw migrate plan codex` para inventariar essas Skills e, em seguida,
  `openclaw migrate codex` para copiá-las para seu espaço de trabalho do OpenClaw.
</Note>

## Skills hospedadas em Node

Um Node headless conectado pode publicar Skills instaladas no diretório ativo de
Skills do OpenClaw (`~/.openclaw/skills` por padrão; substituições de ambiente do perfil
se aplicam). Elas aparecem na lista normal de Skills do agente enquanto o Node está conectado
e desaparecem quando ele se desconecta. Uma Skill local ou do Gateway mantém seu nome em
caso de colisão; a Skill do Node recebe um nome determinístico prefixado pelo Node.
A versão v1 de Skills hospedadas em Node exige que o nome do diretório corresponda ao campo
`name` do frontmatter da Skill.

A entrada da Skill inclui o localizador do Node. Seus arquivos, referências relativas e
binários ficam no Node; portanto, carregue-a e execute-a com
`exec host=node node=<node-id>`. Reinicie o host do Node após alterar os arquivos da Skill.
Consulte [Nodes](/pt-BR/nodes#node-hosted-skills) para saber como emparelhar e desativar esse recurso.

## Skills por agente e compartilhadas

Em configurações com vários agentes, cada agente tem seu próprio espaço de trabalho. Use o caminho que
corresponde à visibilidade desejada:

| Escopo                    | Caminho                      | Visível para                            |
| ------------------------- | ---------------------------- | --------------------------------------- |
| Por agente                | `<workspace>/skills`         | Somente esse agente                     |
| Agente do projeto         | `<workspace>/.agents/skills` | Somente o agente desse espaço de trabalho |
| Agente pessoal            | `~/.agents/skills`           | Todos os agentes nesta máquina          |
| Gerenciado compartilhado  | `~/.openclaw/skills`         | Todos os agentes nesta máquina          |
| Diretórios adicionais     | `skills.load.extraDirs`      | Todos os agentes nesta máquina          |

## Listas de permissões de agentes

A **localização** da Skill (precedência) e sua **visibilidade** (qual agente pode
usá-la) são controles separados. Use listas de permissões para restringir quais Skills um agente vê,
independentemente de onde elas são carregadas.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // base compartilhada
    },
    list: [
      { id: "writer" }, // herda github, weather
      { id: "docs", skills: ["docs-search"] }, // substitui totalmente os padrões
      { id: "locked-down", skills: [] }, // nenhuma Skill
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Regras das listas de permissões">
    - Omita `agents.defaults.skills` para deixar todas as Skills irrestritas por padrão.
    - Omita `agents.list[].skills` para herdar `agents.defaults.skills`.
    - Defina `agents.list[].skills: []` para não expor nenhuma Skill a esse agente.
    - Uma lista `agents.list[].skills` não vazia é o conjunto **final** — ela não é
      combinada com os padrões.
    - A lista de permissões efetiva se aplica à criação de prompts, à descoberta de comandos
      com barra, à sincronização do sandbox e aos snapshots de Skills.
    - Isso não constitui um limite de autorização do shell do host. Se o mesmo agente puder
      usar `exec`, restrinja esse shell separadamente com sandboxing, isolamento de usuário
      do sistema operacional, listas de bloqueio/permissão do exec e credenciais por recurso.
  </Accordion>
</AccordionGroup>

## Plugins e Skills

Plugins podem incluir suas próprias Skills listando diretórios `skills` em
`openclaw.plugin.json` (caminhos relativos à raiz do Plugin). As Skills do Plugin são carregadas
quando o Plugin está habilitado — por exemplo, o Plugin de navegador inclui uma Skill
`browser-automation` para controle do navegador em várias etapas.

Os diretórios de Skills de Plugins são combinados no mesmo nível de baixa precedência que
`skills.load.extraDirs`; portanto, uma Skill incluída, gerenciada, de agente ou de espaço de trabalho
com o mesmo nome os substitui. Controle a elegibilidade da própria Skill de um Plugin por meio de
`metadata.openclaw.requires` em seu frontmatter, como em qualquer outra Skill.

Consulte [Plugins](/pt-BR/tools/plugin) e [Ferramentas](/pt-BR/tools) para conhecer o sistema completo de Plugins.

## Oficina de Skills

A [Oficina de Skills](/pt-BR/tools/skill-workshop) é uma fila de propostas entre o agente
e seus arquivos ativos de Skills. Quando o agente identifica um trabalho reutilizável, ele elabora uma
proposta em vez de gravar diretamente em `SKILL.md`. Você revisa e aprova
antes que qualquer alteração seja feita.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consulte [Oficina de Skills](/pt-BR/tools/skill-workshop) para conhecer o ciclo de vida completo, a referência da
CLI e a configuração.

## Instalação pelo ClawHub

O [ClawHub](https://clawhub.ai) é o registro público de Skills. Use os comandos
`openclaw skills` para instalar e atualizar, ou a CLI `clawhub` para
publicar e sincronizar.

| Ação                                             | Comando                                                |
| ------------------------------------------------ | ------------------------------------------------------ |
| Instalar uma Skill no espaço de trabalho         | `openclaw skills install @owner/<slug>`                |
| Instalar a partir de um repositório Git           | `openclaw skills install git:owner/repo@ref`           |
| Instalar um diretório local de Skill              | `openclaw skills install ./path/to/skill --as my-tool` |
| Instalar para todos os agentes locais             | `openclaw skills install @owner/<slug> --global`       |
| Atualizar todas as Skills do espaço de trabalho   | `openclaw skills update --all`                         |
| Atualizar uma Skill gerenciada compartilhada      | `openclaw skills update @owner/<slug> --global`        |
| Atualizar todas as Skills gerenciadas compartilhadas | `openclaw skills update --all --global`             |
| Verificar o envelope de confiança de uma Skill    | `openclaw skills verify @owner/<slug>`                 |
| Exibir o Cartão da Skill gerado                    | `openclaw skills verify @owner/<slug> --card`          |
| Publicar/sincronizar pela CLI do ClawHub           | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Detalhes da instalação">
    Por padrão, `openclaw skills install` instala no diretório `skills/` do
    espaço de trabalho ativo. Adicione `--global` para instalar no diretório compartilhado
    `~/.openclaw/skills`, visível para todos os agentes locais, a menos que as listas de
    permissões dos agentes restrinjam esse acesso.

    Instalações via Git e locais esperam encontrar `SKILL.md` na raiz da origem. O slug vem
    do campo `name` do frontmatter de `SKILL.md` quando válido e, caso contrário, usa o
    nome do diretório ou do repositório. Use `--as <slug>` para substituí-lo.
    `openclaw skills update` rastreia apenas instalações do ClawHub — reinstale origens Git ou
    locais para atualizá-las.

  </Accordion>
  <Accordion title="Verificação e análise de segurança">
    `openclaw skills verify @owner/<slug>` solicita ao ClawHub o envelope de
    confiança `clawhub.skill.verify.v1` da Skill. As Skills instaladas pelo ClawHub são verificadas
    em relação à versão e ao registro gravados em `.clawhub/origin.json`.
    Slugs sem proprietário continuam aceitos para Skills já instaladas ou não ambíguas, mas
    referências qualificadas pelo proprietário evitam ambiguidades quanto ao publicador.

    As páginas de Skills do ClawHub exibem o estado da análise de segurança mais recente antes da instalação,
    com páginas de detalhes para VirusTotal, ClawScan e análise estática. O
    comando retorna um código diferente de zero quando o ClawHub marca a verificação como falha. Publicadores
    podem corrigir falsos positivos pelo painel do ClawHub ou com
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Instalações de arquivos privados">
    Clientes do Gateway que precisam de distribuição fora do ClawHub podem preparar um arquivo ZIP de Skill
    com `skills.upload.begin`, `skills.upload.chunk` e `skills.upload.commit`
    e, em seguida, instalá-lo com `skills.install({ source: "upload", ... })`. Esse caminho fica
    desativado por padrão e exige `skills.install.allowUploadedArchives: true` em
    `openclaw.json`. Instalações normais pelo ClawHub nunca precisam dessa configuração.
  </Accordion>
</AccordionGroup>

## Segurança

<Warning>
  Trate Skills de terceiros como **código não confiável**. Leia-as antes de habilitá-las.
  Prefira execuções em sandbox para entradas não confiáveis e ferramentas de risco. Consulte
  [Sandboxing](/pt-BR/gateway/sandboxing) para conhecer os controles do lado do agente.
</Warning>

<AccordionGroup>
  <Accordion title="Contenção de caminhos">
    A descoberta de Skills no espaço de trabalho, no agente do projeto e em diretórios adicionais aceita apenas raízes de
    Skills cujo caminho real resolvido permaneça dentro da raiz configurada, a menos que
    `skills.load.allowSymlinkTargets` confie explicitamente em uma raiz de destino.
    A Oficina de Skills grava por meio desses destinos confiáveis somente quando
    `skills.workshop.allowSymlinkTargetWrites` está habilitado.
    Os diretórios gerenciado `~/.openclaw/skills` e pessoal `~/.agents/skills` podem conter
    pastas de Skills vinculadas simbolicamente, mas o caminho real de cada `SKILL.md` ainda deve
    permanecer dentro do diretório resolvido da respectiva Skill.
  </Accordion>
  <Accordion title="Política de instalação do operador">
    Configure `security.installPolicy` para executar um comando de política local confiável
    antes que as instalações de Skills prossigam. A política recebe metadados e o caminho da
    origem preparada, aplica-se ao ClawHub, a uploads, ao Git, a origens locais, a atualizações e aos
    caminhos do instalador de dependências, e falha de forma segura quando o comando não consegue retornar
    uma decisão válida.
  </Accordion>
  <Accordion title="Escopo da injeção de segredos">
    `skills.entries.*.env` e `skills.entries.*.apiKey` injetam segredos no processo do
    **host** somente durante esse turno do agente — não no sandbox. Mantenha
    segredos fora de prompts e logs.
  </Accordion>
</AccordionGroup>

Para conhecer o modelo de ameaças mais amplo e as listas de verificação de segurança, consulte
[Segurança](/pt-BR/gateway/security).

## Formato de SKILL.md

Toda Skill precisa, no mínimo, de `name` e `description` no frontmatter:

```markdown
---
name: image-lab
description: Gere ou edite imagens por meio de um fluxo de trabalho de imagens apoiado por um provedor
---

Quando o usuário solicitar a geração de uma imagem, use a ferramenta `image_generate`...
```

<Note>
  O OpenClaw segue a especificação [AgentSkills](https://agentskills.io). O frontmatter
  é analisado primeiro como YAML; se isso falhar, o sistema recorre a um
  analisador que aceita apenas uma única linha. Blocos `metadata` aninhados
  (incluindo mapeamentos YAML multilinha) são convertidos em uma string JSON e
  analisados novamente como JSON5; portanto, o formato de bloco mostrado em
  [Controle de acesso](#gating) funciona. Use `{baseDir}` no corpo para
  referenciar o caminho da pasta da skill.
</Note>

### Chaves opcionais do frontmatter

<ParamField path="homepage" type="string">
  URL exibida como "Website" na interface de Skills do macOS. Também é
  compatível por meio de `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Quando `true`, a skill é disponibilizada como um comando de barra invocável
  pelo usuário.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quando `true`, o OpenClaw mantém as instruções da skill fora do prompt normal
  do agente. A skill continua disponível como um comando de barra quando
  `user-invocable` também é `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Quando definido como `tool`, o comando de barra ignora o modelo e é
  encaminhado diretamente para uma ferramenta registrada.
</ParamField>

<ParamField path="command-tool" type="string">
  Nome da ferramenta a ser invocada quando `command-dispatch: tool` estiver
  definido.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Para o encaminhamento à ferramenta, repassa a string de argumentos bruta à
  ferramenta sem análise pelo núcleo. A ferramenta recebe
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Controle de acesso

O OpenClaw filtra as skills no momento do carregamento usando
`metadata.openclaw` (objeto JSON5 incorporado ao frontmatter; consulte a
observação sobre análise acima). Uma skill sem um bloco `metadata.openclaw`
sempre é elegível, a menos que seja explicitamente desativada.

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

<ParamField path="always" type="boolean">
  Quando `true`, sempre inclui a skill e ignora todos os outros controles.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji opcional exibido na interface de Skills do macOS.
</ParamField>

<ParamField path="homepage" type="string">
  URL opcional exibida como "Website" na interface de Skills do macOS.
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  Filtro de plataforma. Quando definido, a skill só é elegível em um sistema
  operacional listado.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Cada binário deve existir no `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Pelo menos um binário deve existir no `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Cada variável de ambiente deve existir no processo ou ser fornecida pela
  configuração.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Cada caminho de `openclaw.json` deve ter um valor verdadeiro.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Nome da variável de ambiente associada a `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Especificações opcionais de instalação usadas pela interface de Skills do
  macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  Blocos legados `metadata.clawdbot` ainda são aceitos quando
  `metadata.openclaw` está ausente, para que skills instaladas mais antigas
  mantenham seus controles de dependência e suas dicas de instalação. Novas
  skills devem usar `metadata.openclaw`.
</Note>

### Especificações de instalação

As especificações de instalação informam à interface de Skills do macOS como
instalar uma dependência:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="Regras de seleção do instalador">
    - Quando vários instaladores são listados, o Gateway escolhe uma opção
      preferencial (brew quando disponível; caso contrário, node).
    - Se todos os instaladores forem `download`, o OpenClaw lista cada entrada
      para que você possa ver todos os artefatos disponíveis.
    - As especificações podem incluir `os: ["darwin"|"linux"|"win32"]` para
      filtrar por plataforma.
    - Instalações com Node respeitam `skills.install.nodeManager` em
      `openclaw.json` (padrão: npm; opções: npm / pnpm / yarn / bun). Isso afeta
      apenas instalações de skills; o ambiente de execução do Gateway ainda
      deve ser Node.
    - Preferência de instalador do Gateway: Homebrew → uv → gerenciador de node
      configurado → go → download.
  </Accordion>
  <Accordion title="Detalhes por instalador">
    - **Homebrew:** o OpenClaw não instala o Homebrew automaticamente nem
      converte fórmulas do brew em comandos do gerenciador de pacotes do
      sistema. Em contêineres Linux sem `brew`, instaladores exclusivos do brew
      ficam ocultos; use uma imagem personalizada ou instale a dependência
      manualmente.
    - **Go:** o OpenClaw exige Go 1.21 ou mais recente para instalações
      automáticas de skills. Se `go` estiver ausente e o Homebrew estiver
      disponível, o OpenClaw primeiro instalará o Go por meio do Homebrew; no
      Linux sem Homebrew, ele poderá usar `apt-get` como root ou por meio de
      `sudo` sem senha quando o candidato atualizado `golang-go` atender à
      versão mínima. O `go install` efetivo da dependência sempre usa como
      destino um diretório de binários dedicado e gerenciado pelo OpenClaw
      (o `bin` do Homebrew em uma instalação nova; caso contrário,
      `~/.local/bin`), em vez do `GOBIN` configurado — suas próprias variáveis
      de ambiente `GOBIN`, `GOPATH` e `GOTOOLCHAIN` são lidas, mas nunca
      sobrescritas.
    - **Download:** `url` (obrigatório), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (padrão: automático quando um arquivo compactado é detectado),
      `stripComponents`, `targetDir` (padrão:
      `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Observações sobre isolamento">
    `requires.bins` é verificado no **host** no momento do carregamento da
    skill. Se um agente for executado em um ambiente isolado, o binário também
    deverá existir **dentro do contêiner**. Instale-o por meio de
    `agents.defaults.sandbox.docker.setupCommand` ou de uma imagem
    personalizada. `setupCommand` é executado uma vez após a criação do
    contêiner e exige acesso de saída à rede, um sistema de arquivos raiz
    gravável e um usuário root no ambiente isolado.
  </Accordion>
</AccordionGroup>

## Substituições de configuração

Ative e configure skills incluídas ou gerenciadas em `skills.entries` no
arquivo `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  `false` desativa a skill mesmo quando ela está incluída ou instalada. A skill
  incluída `coding-agent` exige ativação — defina
  `skills.entries.coding-agent.enabled: true` e garanta que `claude`, `codex`,
  `opencode` ou outra CLI compatível esteja instalada e autenticada.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Campo de conveniência para skills que declaram
  `metadata.openclaw.primaryEnv`. Aceita uma string de texto simples ou um
  objeto SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Variáveis de ambiente injetadas na execução do agente. A injeção ocorre
  apenas quando a variável ainda não está definida no processo.
</ParamField>

<ParamField path="config" type="object">
  Conjunto opcional de campos de configuração personalizados por skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Lista de permissões opcional apenas para skills **incluídas**. Quando
  definida, somente as skills incluídas na lista são elegíveis. Skills
  gerenciadas e do espaço de trabalho não são afetadas.
</ParamField>

<Note>
  Por padrão, as chaves de configuração correspondem ao **nome da skill**. Se
  uma skill definir `metadata.openclaw.skillKey`, use essa chave em
  `skills.entries`. Coloque nomes com hífen entre aspas: o JSON5 permite chaves
  entre aspas.
</Note>

## Injeção de ambiente

Quando uma execução de agente é iniciada, o OpenClaw:

<Steps>
  <Step title="Lê os metadados das skills">
    O OpenClaw resolve a lista efetiva de skills do agente, aplicando regras de
    controle, listas de permissões e substituições de configuração.
  </Step>
  <Step title="Injeta variáveis de ambiente e chaves de API">
    `skills.entries.<key>.env` e `skills.entries.<key>.apiKey` são aplicados a
    `process.env` durante a execução.
  </Step>
  <Step title="Cria o prompt do sistema">
    As skills elegíveis são compiladas em um bloco XML compacto e injetadas no
    prompt do sistema.
  </Step>
  <Step title="Restaura o ambiente">
    Após o término da execução, o ambiente original é restaurado.
  </Step>
</Steps>

<Warning>
  A injeção de variáveis de ambiente é limitada à execução do agente no
  **host**, não ao ambiente isolado. Dentro de um ambiente isolado, `env` e
  `apiKey` não têm efeito. Consulte
  [Configuração de Skills](/pt-BR/tools/skills-config#sandboxed-skills-and-env-vars)
  para saber como passar segredos a execuções em ambientes isolados.
</Warning>

Para o backend incluído `claude-cli`, o OpenClaw também materializa o mesmo
snapshot de skills elegíveis como um Plugin temporário do Claude Code e o
transmite por meio de `--plugin-dir`. Outros backends de CLI usam apenas o
catálogo do prompt.

## Snapshots e atualização

O OpenClaw cria um snapshot das skills elegíveis **quando uma sessão é
iniciada** e reutiliza essa lista em todos os turnos seguintes da sessão.
Alterações nas skills ou na configuração entram em vigor na próxima sessão
nova.

As Skills são atualizadas durante a sessão em dois casos:

- O monitor de skills detecta uma alteração em `SKILL.md`.
- Um novo node remoto elegível se conecta.

A lista atualizada é utilizada no próximo turno do agente. Se a lista de
permissões efetiva do agente mudar, o OpenClaw atualizará o snapshot para
manter as skills visíveis alinhadas.

<AccordionGroup>
  <Accordion title="Monitor de Skills">
    Por padrão, o OpenClaw monitora as pastas de skills e atualiza o snapshot
    quando arquivos `SKILL.md` são alterados. Configure em `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // default
          watchDebounceMs: 250, // default
        },
      },
    }
    ```

    Use `allowSymlinkTargets` para estruturas intencionais com links simbólicos
    em que o link simbólico da raiz de uma skill aponta para fora da raiz
    configurada, por exemplo,
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Ative `skills.workshop.allowSymlinkTargetWrites` somente quando o Skill
    Workshop também precisar aplicar propostas por meio desses caminhos
    confiáveis com links simbólicos.

  </Accordion>
  <Accordion title="Nodes macOS remotos (Gateway Linux)">
    Se o Gateway for executado no Linux, mas um **node macOS** estiver conectado
    com `system.run` permitido, o OpenClaw poderá considerar elegíveis as skills
    exclusivas do macOS quando os binários necessários estiverem presentes
    nesse node. O agente deve executar essas skills por meio da ferramenta
    `exec` com `host=node`.

    Nodes offline **não** tornam visíveis skills exclusivamente remotas. Se um
    node parar de responder às sondagens de binários, o OpenClaw removerá as
    correspondências de binários armazenadas em cache.

  </Accordion>
</AccordionGroup>

## Impacto em tokens

Quando as skills são elegíveis, o OpenClaw injeta um bloco XML compacto no
prompt do sistema. O custo é determinístico e cresce linearmente por skill:

- **Sobrecarga básica** (somente quando uma ou mais skills são elegíveis): um
  bloco fixo de texto introdutório mais o invólucro `<available_skills>`.
- **Por skill:** aproximadamente 97 caracteres mais os comprimentos dos campos
  `name`, `description` e `location`.
- O escape de XML expande `& < > " '` em entidades, adicionando alguns
  caracteres por ocorrência.
- Com aproximadamente 4 caracteres por token, 97 caracteres ≈ 24 tokens por
  skill antes dos comprimentos dos campos.

Se o bloco renderizado exceder o orçamento de prompt configurado
(`skills.limits.maxSkillsPromptChars`), o OpenClaw primeiro preservará o máximo possível de
identidades de Skills (nome, localização e versão) que couberem no formato
compacto sem descrições. Em seguida, usará o orçamento restante para descrições
abreviadas. Se não restar orçamento para descrições, elas serão omitidas. O prompt
incluirá uma observação indicando `openclaw skills check` sempre que for necessário
usar a formatação compacta ou truncar a lista.

Mantenha as descrições curtas e informativas para minimizar a sobrecarga do prompt.

## Conteúdo relacionado

<CardGroup cols={2}>
  <Card title="Criação de Skills" href="/pt-BR/tools/creating-skills" icon="hammer">
    Guia passo a passo para criar uma Skill personalizada.
  </Card>
  <Card title="Oficina de Skills" href="/pt-BR/tools/skill-workshop" icon="flask">
    Fila de propostas de Skills elaboradas por agentes.
  </Card>
  <Card title="Configuração de Skills" href="/pt-BR/tools/skills-config" icon="gear">
    Esquema completo de configuração de `skills.*` e listas de permissões de agentes.
  </Card>
  <Card title="Comandos de barra" href="/pt-BR/tools/slash-commands" icon="terminal">
    Como os comandos de barra de Skills são registrados e roteados.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Explore e publique Skills no registro público.
  </Card>
  <Card title="Plugins" href="/pt-BR/tools/plugin" icon="plug">
    Plugins podem incluir Skills junto com as ferramentas que documentam.
  </Card>
</CardGroup>
