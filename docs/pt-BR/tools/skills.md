---
read_when:
    - Adicionando ou modificando Skills
    - Alteração de restrições, listas de permissões ou regras de carregamento de Skills
    - Entendendo a precedência de Skills e o comportamento de snapshots
sidebarTitle: Skills
summary: As Skills ensinam seu agente a usar ferramentas. Saiba como elas são carregadas, como funciona a precedência e como configurar restrições, listas de permissões e injeção de variáveis de ambiente.
title: Skills
x-i18n:
    generated_at: "2026-07-12T15:43:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills são arquivos de instruções em markdown que ensinam ao agente como e quando usar
ferramentas. Cada skill fica em um diretório que contém um arquivo `SKILL.md` com
frontmatter YAML e um corpo em markdown. O OpenClaw carrega as skills incluídas, além de quaisquer
substituições locais, e as filtra no momento do carregamento com base no ambiente, na configuração e
na presença de binários.

<CardGroup cols={2}>
  <Card title="Criação de skills" href="/pt-BR/tools/creating-skills" icon="hammer">
    Crie e teste uma skill personalizada do zero.
  </Card>
  <Card title="Oficina de Skills" href="/pt-BR/tools/skill-workshop" icon="flask">
    Revise e aprove propostas de skills elaboradas pelo agente.
  </Card>
  <Card title="Configuração de skills" href="/pt-BR/tools/skills-config" icon="gear">
    Esquema completo de configuração `skills.*` e listas de permissões de agentes.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Explore e instale skills da comunidade.
  </Card>
</CardGroup>

## Ordem de carregamento

O OpenClaw carrega a partir destas fontes, **da maior para a menor precedência**. Quando o mesmo
nome de skill aparece em vários locais, prevalece a fonte de maior precedência.

| Prioridade    | Fonte                         | Caminho                                 |
| ------------- | ----------------------------- | --------------------------------------- |
| 1 — mais alta | Skills do workspace           | `<workspace>/skills`                    |
| 2             | Skills do agente do projeto   | `<workspace>/.agents/skills`            |
| 3             | Skills pessoais do agente     | `~/.agents/skills`                      |
| 4             | Skills gerenciadas / locais   | `~/.openclaw/skills`                    |
| 5             | Skills incluídas              | fornecidas com a instalação             |
| 6 — mais baixa| Diretórios adicionais         | `skills.load.extraDirs` + skills de plugins |

As raízes de skills aceitam layouts agrupados. O OpenClaw descobre uma skill sempre que
`SKILL.md` aparece em qualquer lugar sob uma raiz configurada (até 6 níveis de profundidade):

```text
<workspace>/skills/research/SKILL.md          ✓ encontrada como "research"
<workspace>/skills/personal/research/SKILL.md ✓ também encontrada como "research"
```

O caminho da pasta serve apenas para organização. O nome e o comando de barra da skill
vêm do campo `name` do frontmatter (ou do nome do diretório quando `name` está
ausente). As listas de permissões de agentes (abaixo) também fazem a correspondência por esse `name`.

<Note>
  O diretório nativo `$CODEX_HOME/skills` da CLI do Codex **não** é uma raiz de
  skills do OpenClaw. Use `openclaw migrate plan codex` para inventariar essas skills e depois
  `openclaw migrate codex` para copiá-las para seu workspace do OpenClaw.
</Note>

## Skills hospedadas em Node

Um Node headless conectado pode publicar skills instaladas no diretório ativo de
skills do OpenClaw (`~/.openclaw/skills` por padrão; substituições do ambiente do perfil
se aplicam). Elas aparecem na lista normal de skills do agente enquanto o Node está conectado
e desaparecem quando ele se desconecta. Uma skill local ou do Gateway mantém seu nome em
caso de conflito; a skill do Node recebe um nome determinístico prefixado pelo Node.
A v1 das skills hospedadas em Node exige que o nome do diretório corresponda ao campo `name`
do frontmatter da skill.

A entrada da skill inclui o localizador do Node. Seus arquivos, referências relativas e
binários ficam no Node; portanto, carregue-a e execute-a com
`exec host=node node=<node-id>`. Reinicie o host do Node após alterar os arquivos da
skill. Consulte [Nodes](/pt-BR/nodes#node-hosted-skills) para ver o pareamento e as opções de desativação.

## Skills por agente versus compartilhadas

Em configurações com vários agentes, cada agente tem seu próprio workspace. Use o caminho que
corresponde à visibilidade desejada:

| Escopo                  | Caminho                      | Visível para                        |
| ----------------------- | ---------------------------- | ----------------------------------- |
| Por agente              | `<workspace>/skills`         | Somente esse agente                 |
| Agente do projeto       | `<workspace>/.agents/skills` | Somente o agente desse workspace    |
| Agente pessoal          | `~/.agents/skills`           | Todos os agentes desta máquina      |
| Gerenciado compartilhado| `~/.openclaw/skills`         | Todos os agentes desta máquina      |
| Diretórios adicionais   | `skills.load.extraDirs`      | Todos os agentes desta máquina      |

## Listas de permissões de agentes

A **localização** da skill (precedência) e a **visibilidade** da skill (qual agente pode
usá-la) são controles separados. Use listas de permissões para restringir quais skills um agente vê,
independentemente de onde elas são carregadas.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // linha de base compartilhada
    },
    list: [
      { id: "writer" }, // herda github, weather
      { id: "docs", skills: ["docs-search"] }, // substitui completamente os padrões
      { id: "locked-down", skills: [] }, // nenhuma skill
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Regras das listas de permissões">
    - Omita `agents.defaults.skills` para deixar todas as skills sem restrições por padrão.
    - Omita `agents.list[].skills` para herdar `agents.defaults.skills`.
    - Defina `agents.list[].skills: []` para não expor nenhuma skill a esse agente.
    - Uma lista `agents.list[].skills` não vazia é o conjunto **final** — ela não é
      mesclada com os padrões.
    - A lista de permissões efetiva se aplica à construção de prompts, à descoberta de
      comandos de barra, à sincronização do sandbox e aos snapshots de skills.
    - Isso não é um limite de autorização do shell do host. Se o mesmo agente puder
      usar `exec`, restrinja esse shell separadamente com sandboxing, isolamento de
      usuário do sistema operacional, listas de bloqueio/permissão do exec e credenciais por recurso.
  </Accordion>
</AccordionGroup>

## Plugins e skills

Plugins podem fornecer suas próprias skills listando diretórios `skills` em
`openclaw.plugin.json` (caminhos relativos à raiz do plugin). As skills do plugin são carregadas
quando o plugin está habilitado — por exemplo, o plugin de navegador fornece uma skill
`browser-automation` para controle do navegador em várias etapas.

Os diretórios de skills de plugins são mesclados no mesmo nível de baixa precedência que
`skills.load.extraDirs`; portanto, uma skill com o mesmo nome que seja incluída, gerenciada, de agente
ou de workspace os substitui. Controle a elegibilidade da própria skill de um plugin por meio de
`metadata.openclaw.requires` em seu frontmatter, como em qualquer outra skill.

Consulte [Plugins](/pt-BR/tools/plugin) e [Ferramentas](/pt-BR/tools) para conhecer o sistema completo de plugins.

## Oficina de Skills

A [Oficina de Skills](/pt-BR/tools/skill-workshop) é uma fila de propostas entre o agente
e seus arquivos de skills ativos. Quando o agente identifica um trabalho reutilizável, ele elabora uma
proposta em vez de gravar diretamente em `SKILL.md`. Você revisa e aprova
antes que qualquer alteração ocorra.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consulte [Oficina de Skills](/pt-BR/tools/skill-workshop) para ver o ciclo de vida completo, a referência da CLI
e a configuração.

## Instalação pelo ClawHub

O [ClawHub](https://clawhub.ai) é o registro público de skills. Use os comandos
`openclaw skills` para instalar e atualizar, ou a CLI `clawhub` para
publicar e sincronizar.

| Ação                                           | Comando                                                |
| ---------------------------------------------- | ------------------------------------------------------ |
| Instalar uma skill no workspace                | `openclaw skills install @owner/<slug>`                |
| Instalar a partir de um repositório Git        | `openclaw skills install git:owner/repo@ref`           |
| Instalar um diretório local de skill           | `openclaw skills install ./path/to/skill --as my-tool` |
| Instalar para todos os agentes locais          | `openclaw skills install @owner/<slug> --global`       |
| Atualizar todas as skills do workspace         | `openclaw skills update --all`                         |
| Atualizar uma skill gerenciada compartilhada   | `openclaw skills update @owner/<slug> --global`        |
| Atualizar todas as skills gerenciadas compartilhadas | `openclaw skills update --all --global`          |
| Verificar o envelope de confiança de uma skill | `openclaw skills verify @owner/<slug>`                 |
| Imprimir o Cartão da Skill gerado              | `openclaw skills verify @owner/<slug> --card`          |
| Publicar / sincronizar pela CLI do ClawHub      | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Detalhes da instalação">
    Por padrão, `openclaw skills install` instala no diretório `skills/` do
    workspace ativo. Adicione `--global` para instalar no diretório compartilhado
    `~/.openclaw/skills`, visível para todos os agentes locais, a menos que as listas
    de permissões dos agentes o restrinjam.

    Instalações do Git e locais esperam `SKILL.md` na raiz da origem. O slug vem
    do campo `name` do frontmatter de `SKILL.md` quando válido e, caso contrário, usa o
    nome do diretório ou do repositório. Use `--as <slug>` para substituí-lo.
    `openclaw skills update` rastreia somente instalações do ClawHub — reinstale as
    origens do Git ou locais para atualizá-las.

  </Accordion>
  <Accordion title="Verificação e análise de segurança">
    `openclaw skills verify @owner/<slug>` solicita ao ClawHub o envelope de
    confiança `clawhub.skill.verify.v1` da skill. As skills instaladas pelo ClawHub são verificadas
    em relação à versão e ao registro gravados em `.clawhub/origin.json`.
    Slugs sem proprietário continuam sendo aceitos para skills já instaladas ou não ambíguas, mas
    referências qualificadas pelo proprietário evitam ambiguidade sobre o publicador.

    As páginas de skills do ClawHub exibem o estado mais recente da análise de segurança antes da instalação,
    com páginas detalhadas para VirusTotal, ClawScan e análise estática. O
    comando termina com código diferente de zero quando o ClawHub marca a verificação como falha. Os publicadores
    podem corrigir falsos positivos pelo painel do ClawHub ou com
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Instalações de arquivos privados">
    Clientes do Gateway que precisam de entrega fora do ClawHub podem preparar um arquivo zip de skill
    com `skills.upload.begin`, `skills.upload.chunk` e `skills.upload.commit`,
    e depois instalá-lo com `skills.install({ source: "upload", ... })`. Esse caminho fica
    desativado por padrão e exige `skills.install.allowUploadedArchives: true` em
    `openclaw.json`. Instalações normais do ClawHub nunca precisam dessa configuração.
  </Accordion>
</AccordionGroup>

## Segurança

<Warning>
  Trate skills de terceiros como **código não confiável**. Leia-as antes de habilitá-las.
  Prefira execuções em sandbox para entradas não confiáveis e ferramentas de risco. Consulte
  [Sandboxing](/pt-BR/gateway/sandboxing) para ver os controles do lado do agente.
</Warning>

<AccordionGroup>
  <Accordion title="Contenção de caminhos">
    A descoberta de skills no workspace, no agente do projeto e em diretórios adicionais aceita apenas raízes de
    skills cujo realpath resolvido permaneça dentro da raiz configurada, a menos que
    `skills.load.allowSymlinkTargets` confie explicitamente em uma raiz de destino.
    A Oficina de Skills grava por meio desses destinos confiáveis somente quando
    `skills.workshop.allowSymlinkTargetWrites` está habilitado.
    Os diretórios gerenciados `~/.openclaw/skills` e pessoais `~/.agents/skills` podem conter
    pastas de skills vinculadas simbolicamente, mas o realpath de cada `SKILL.md` ainda deve permanecer
    dentro do diretório resolvido da respectiva skill.
  </Accordion>
  <Accordion title="Política de instalação do operador">
    Configure `security.installPolicy` para executar um comando confiável de política local
    antes que as instalações de skills prossigam. A política recebe metadados e o caminho da
    origem preparada, aplica-se a caminhos do ClawHub, de uploads, do Git, locais, de atualização e
    de instaladores de dependências, e falha de forma fechada quando o comando não consegue retornar
    uma decisão válida.
  </Accordion>
  <Accordion title="Escopo da injeção de segredos">
    `skills.entries.*.env` e `skills.entries.*.apiKey` injetam segredos no
    processo do **host** somente durante aquele turno do agente — não no sandbox. Mantenha
    segredos fora de prompts e logs.
  </Accordion>
</AccordionGroup>

Para o modelo de ameaças mais amplo e as listas de verificação de segurança, consulte
[Segurança](/pt-BR/gateway/security).

## Formato de SKILL.md

Toda skill precisa ter, no mínimo, `name` e `description` no frontmatter:

```markdown
---
name: image-lab
description: Gere ou edite imagens por meio de um fluxo de trabalho de imagens apoiado por um provedor
---

Quando o usuário solicitar a geração de uma imagem, use a ferramenta `image_generate`...
```

<Note>
  O OpenClaw segue a especificação [AgentSkills](https://agentskills.io). O frontmatter
  é analisado primeiro como YAML; se isso falhar, ele recorre a um analisador
  exclusivo para uma única linha. Blocos `metadata` aninhados (incluindo mapeamentos
  YAML de várias linhas) são convertidos em uma string JSON e analisados novamente
  como JSON5, portanto o formato de bloco mostrado em [Controle de acesso](#gating)
  funciona. Use `{baseDir}` no corpo para referenciar o caminho da pasta da Skill.
</Note>

### Chaves opcionais do frontmatter

<ParamField path="homepage" type="string">
  URL exibida como "Website" na interface de Skills do macOS. Também há suporte
  por meio de `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Quando `true`, a Skill é disponibilizada como um comando de barra invocável
  pelo usuário.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quando `true`, o OpenClaw mantém as instruções da Skill fora do prompt normal
  do agente. A Skill continua disponível como um comando de barra quando
  `user-invocable` também é `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Quando definido como `tool`, o comando de barra ignora o modelo e é
  encaminhado diretamente a uma ferramenta registrada.
</ParamField>

<ParamField path="command-tool" type="string">
  Nome da ferramenta a ser invocada quando `command-dispatch: tool` estiver
  definido.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Para o encaminhamento à ferramenta, repassa a string bruta de argumentos à
  ferramenta sem análise pelo núcleo. A ferramenta recebe
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Controle de acesso

O OpenClaw filtra as Skills no momento do carregamento usando `metadata.openclaw`
(objeto JSON5 incorporado ao frontmatter; consulte a observação sobre análise
acima). Uma Skill sem um bloco `metadata.openclaw` é sempre elegível, a menos
que seja explicitamente desativada.

```markdown
---
name: image-lab
description: Gere ou edite imagens por meio de um fluxo de trabalho de imagens apoiado por um provedor
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
  Quando `true`, sempre inclui a Skill e ignora todos os outros controles.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji opcional exibido na interface de Skills do macOS.
</ParamField>

<ParamField path="homepage" type="string">
  URL opcional exibida como "Website" na interface de Skills do macOS.
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  Filtro de plataforma. Quando definido, a Skill só é elegível em um sistema
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
  Especificações opcionais de instaladores usadas pela interface de Skills do
  macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  Blocos legados `metadata.clawdbot` ainda são aceitos quando
  `metadata.openclaw` está ausente, para que Skills instaladas mais antigas
  mantenham seus controles de dependências e suas sugestões de instaladores.
  Novas Skills devem usar `metadata.openclaw`.
</Note>

### Especificações de instaladores

As especificações de instaladores informam à interface de Skills do macOS como
instalar uma dependência:

```markdown
---
name: gemini
description: Use a CLI do Gemini para assistência de programação e consultas de pesquisa no Google.
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
              "label": "Instalar a CLI do Gemini (brew)",
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
      apenas as instalações de Skills; o runtime do Gateway ainda deve ser Node.
    - Preferência de instaladores do Gateway: Homebrew → uv → gerenciador de
      node configurado → go → download.
  </Accordion>
  <Accordion title="Detalhes por instalador">
    - **Homebrew:** o OpenClaw não instala o Homebrew automaticamente nem
      converte fórmulas do brew em comandos do gerenciador de pacotes do
      sistema. Em contêineres Linux sem `brew`, instaladores exclusivos do brew
      ficam ocultos; use uma imagem personalizada ou instale a dependência
      manualmente.
    - **Go:** o OpenClaw requer Go 1.21 ou posterior para instalações
      automáticas de Skills. Se `go` estiver ausente e o Homebrew estiver
      disponível, o OpenClaw instala primeiro o Go por meio do Homebrew; no
      Linux sem Homebrew, ele pode usar `apt-get` como root ou por meio de
      `sudo` sem senha quando o candidato atualizado `golang-go` atender à
      versão mínima. O `go install` efetivo da dependência sempre usa como
      destino um diretório de binários dedicado, gerenciado pelo OpenClaw
      (`bin` do Homebrew em uma instalação nova; caso contrário,
      `~/.local/bin`), em vez do `GOBIN` configurado — suas próprias variáveis
      de ambiente `GOBIN`, `GOPATH` e `GOTOOLCHAIN` são lidas, mas nunca
      sobrescritas.
    - **Download:** `url` (obrigatório), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (padrão: automático quando um arquivo compactado é detectado),
      `stripComponents`, `targetDir` (padrão: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Observações sobre isolamento">
    `requires.bins` é verificado no **host** no momento do carregamento da
    Skill. Se um agente for executado em um sandbox, o binário também deverá
    existir **dentro do contêiner**. Instale-o por meio de
    `agents.defaults.sandbox.docker.setupCommand` ou de uma imagem
    personalizada. `setupCommand` é executado uma vez após a criação do
    contêiner e requer acesso de saída à rede, um sistema de arquivos raiz
    gravável e um usuário root no sandbox.
  </Accordion>
</AccordionGroup>

## Substituições de configuração

Ative, desative e configure Skills incluídas ou gerenciadas em `skills.entries`
no arquivo `~/.openclaw/openclaw.json`:

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
  `false` desativa a Skill mesmo quando ela está incluída ou instalada. A Skill
  incluída `coding-agent` é opt-in — defina
  `skills.entries.coding-agent.enabled: true` e garanta que `claude`, `codex`,
  `opencode` ou outra CLI compatível esteja instalada e autenticada.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Campo de conveniência para Skills que declaram
  `metadata.openclaw.primaryEnv`. Aceita uma string em texto simples ou um
  objeto SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Variáveis de ambiente injetadas na execução do agente. São injetadas apenas
  quando a variável ainda não está definida no processo.
</ParamField>

<ParamField path="config" type="object">
  Conjunto opcional de campos personalizados de configuração por Skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Lista de permissões opcional apenas para Skills **incluídas**. Quando
  definida, apenas as Skills incluídas presentes na lista são elegíveis. Skills
  gerenciadas e do espaço de trabalho não são afetadas.
</ParamField>

<Note>
  Por padrão, as chaves de configuração correspondem ao **nome da Skill**. Se
  uma Skill definir `metadata.openclaw.skillKey`, use essa chave em
  `skills.entries`. Coloque nomes com hífen entre aspas: o JSON5 permite chaves
  entre aspas.
</Note>

## Injeção de ambiente

Quando a execução de um agente começa, o OpenClaw:

<Steps>
  <Step title="Lê os metadados das Skills">
    O OpenClaw resolve a lista efetiva de Skills do agente, aplicando regras de
    controle, listas de permissões e substituições de configuração.
  </Step>
  <Step title="Injeta variáveis de ambiente e chaves de API">
    `skills.entries.<key>.env` e `skills.entries.<key>.apiKey` são aplicados a
    `process.env` durante a execução.
  </Step>
  <Step title="Cria o prompt do sistema">
    As Skills elegíveis são compiladas em um bloco XML compacto e injetadas no
    prompt do sistema.
  </Step>
  <Step title="Restaura o ambiente">
    Após o término da execução, o ambiente original é restaurado.
  </Step>
</Steps>

<Warning>
  A injeção de variáveis de ambiente é limitada à execução do agente no
  **host**, não ao sandbox. Dentro de um sandbox, `env` e `apiKey` não têm
  efeito. Consulte [Configuração de Skills](/pt-BR/tools/skills-config#sandboxed-skills-and-env-vars)
  para saber como passar segredos a execuções em sandbox.
</Warning>

Para o backend incluído `claude-cli`, o OpenClaw também materializa o mesmo
snapshot de Skills elegíveis como um Plugin temporário do Claude Code e o
repassa por meio de `--plugin-dir`. Outros backends de CLI usam apenas o
catálogo do prompt.

## Snapshots e atualização

O OpenClaw cria um snapshot das Skills elegíveis **quando uma sessão começa** e
reutiliza essa lista em todos os turnos posteriores da sessão. Alterações nas
Skills ou na configuração entram em vigor na próxima sessão nova.

As Skills são atualizadas durante a sessão em dois casos:

- O observador de Skills detecta uma alteração em `SKILL.md`.
- Um novo node remoto elegível se conecta.

A lista atualizada é usada no próximo turno do agente. Se a lista efetiva de
permissões do agente mudar, o OpenClaw atualizará o snapshot para manter as
Skills visíveis alinhadas.

<AccordionGroup>
  <Accordion title="Observador de Skills">
    Por padrão, o OpenClaw observa as pastas de Skills e atualiza o snapshot
    quando arquivos `SKILL.md` são alterados. Configure em `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // padrão
          watchDebounceMs: 250, // padrão
        },
      },
    }
    ```

    Use `allowSymlinkTargets` para layouts intencionais com links simbólicos,
    nos quais um link simbólico da raiz de uma Skill aponta para fora da raiz
    configurada, por exemplo,
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Ative `skills.workshop.allowSymlinkTargetWrites` somente quando o Skill
    Workshop também precisar aplicar propostas por meio desses caminhos
    confiáveis com links simbólicos.

  </Accordion>
  <Accordion title="Nodes macOS remotos (Gateway Linux)">
    Se o Gateway for executado no Linux, mas um **node macOS** estiver conectado
    com `system.run` permitido, o OpenClaw poderá considerar elegíveis as Skills
    exclusivas do macOS quando os binários necessários estiverem presentes
    nesse node. O agente deve executar essas Skills por meio da ferramenta
    `exec` com `host=node`.

    Nodes offline **não** tornam visíveis Skills exclusivas de acesso remoto. Se
    um node parar de responder às sondagens de binários, o OpenClaw limpará as
    correspondências de binários armazenadas em cache.

  </Accordion>
</AccordionGroup>

## Impacto em tokens

Quando há Skills elegíveis, o OpenClaw injeta um bloco XML compacto no prompt
do sistema. O custo é determinístico e aumenta linearmente por Skill:

- **Sobrecarga base** (somente quando pelo menos 1 Skill é elegível): um bloco
  fixo de texto introdutório mais o invólucro `<available_skills>`.
- **Por Skill:** ~97 caracteres + os comprimentos dos campos `name`,
  `description` e `location`.
- O escape de XML expande `& < > " '` para entidades, adicionando alguns
  caracteres por ocorrência.
- Com ~4 caracteres/token, 97 caracteres ≈ 24 tokens por Skill antes dos
  comprimentos dos campos.

Se o bloco renderizado exceder o orçamento de prompt configurado
(`skills.limits.maxSkillsPromptChars`), o OpenClaw primeiro preservará o máximo possível de
identidades de Skills (nome, local e versão) que couberem no formato compacto
sem descrições. Em seguida, usará o orçamento restante para descrições abreviadas. Se não
restar orçamento para descrições, elas serão omitidas. O prompt incluirá uma
observação indicando `openclaw skills check` sempre que a formatação compacta ou o
truncamento da lista forem necessários.

Mantenha as descrições curtas e informativas para minimizar a sobrecarga do prompt.

## Relacionado

<CardGroup cols={2}>
  <Card title="Criar Skills" href="/pt-BR/tools/creating-skills" icon="hammer">
    Guia passo a passo para criar uma Skill personalizada.
  </Card>
  <Card title="Workshop de Skills" href="/pt-BR/tools/skill-workshop" icon="flask">
    Fila de propostas de Skills elaboradas por agentes.
  </Card>
  <Card title="Configuração de Skills" href="/pt-BR/tools/skills-config" icon="gear">
    Esquema completo de configuração `skills.*` e listas de permissões de agentes.
  </Card>
  <Card title="Comandos de barra" href="/pt-BR/tools/slash-commands" icon="terminal">
    Como os comandos de barra das Skills são registrados e roteados.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Explore e publique Skills no registro público.
  </Card>
  <Card title="Plugins" href="/pt-BR/tools/plugin" icon="plug">
    Plugins podem incluir Skills junto com as ferramentas que documentam.
  </Card>
</CardGroup>
