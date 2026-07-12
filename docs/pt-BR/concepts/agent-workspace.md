---
read_when:
    - Você precisa explicar o espaço de trabalho do agente ou a organização dos arquivos dele
    - Você quer fazer backup ou migrar um espaço de trabalho de agente
sidebarTitle: Agent workspace
summary: 'Espaço de trabalho do agente: localização, estrutura e estratégia de backup'
title: Espaço de trabalho do agente
x-i18n:
    generated_at: "2026-07-12T15:04:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e09c26d19dd7926b379ae4d094c98c2a2f5b37b9453a4cc2048c3b212ae5a9c2
    source_path: concepts/agent-workspace.md
    workflow: 16
---

O workspace é a área principal do agente: o diretório de trabalho usado pelas ferramentas de arquivo
e pelo contexto do workspace. Mantenha-o privado e trate-o como memória.

Isso é separado de `~/.openclaw/`, que armazena configurações, credenciais e sessões.

<Warning>
O workspace é o **cwd padrão**, não um sandbox rígido. As ferramentas resolvem caminhos relativos com base no workspace, mas caminhos absolutos ainda podem acessar outros locais no host, a menos que o isolamento por sandbox esteja habilitado. Se você precisar de isolamento, use [`agents.defaults.sandbox`](/pt-BR/gateway/sandboxing) (e/ou uma configuração de sandbox por agente).

Quando o isolamento por sandbox está habilitado e `workspaceAccess` não é `"rw"`, as ferramentas operam dentro de um workspace de sandbox em `~/.openclaw/sandboxes`, não no workspace do host.
</Warning>

## Local padrão

- Padrão: `~/.openclaw/workspace`
- Se `OPENCLAW_PROFILE` estiver definido e não for `"default"`, o padrão passa a ser `~/.openclaw/workspace-<profile>`.
- `OPENCLAW_WORKSPACE_DIR` substitui ambos os valores acima quando definido.
- Agentes não padrão (`agents.list[]`) sem um workspace explícito são resolvidos como `<state-dir>/workspace-<agentId>`, não como o workspace padrão compartilhado.

Substitua em `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

Substituição por agente: `agents.list[].workspace`.

`openclaw onboard`, `openclaw configure` ou `openclaw setup` criam o workspace e preenchem os arquivos de inicialização caso estejam ausentes.

<Note>
As cópias iniciais do sandbox aceitam apenas arquivos regulares dentro do workspace; aliases de links simbólicos ou links físicos que apontam para fora do workspace de origem são ignorados.
</Note>

Se você já gerencia os arquivos do workspace por conta própria, desabilite a criação dos arquivos de inicialização:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Pastas adicionais de workspace

Instalações mais antigas podem ter criado `~/openclaw`. Manter vários diretórios de workspace pode causar confusão na autenticação ou divergência de estado, pois apenas um workspace fica ativo por vez.

<Note>
**Recomendação:** mantenha um único workspace ativo. Se você não usa mais as pastas adicionais, arquive-as ou mova-as para a Lixeira (por exemplo, `trash ~/openclaw`). Se você mantiver intencionalmente vários workspaces, confirme que `agents.defaults.workspace` (ou a chave `workspace` por agente) aponta para o workspace ativo.
</Note>

## Mapa de arquivos do workspace

Arquivos padrão que o OpenClaw espera encontrar no workspace:

<AccordionGroup>
  <Accordion title="AGENTS.md — instruções operacionais">
    Instruções operacionais para o agente e sobre como ele deve usar a memória. Carregado no início de cada sessão. É um bom lugar para regras, prioridades e detalhes sobre “como se comportar”.
  </Accordion>
  <Accordion title="SOUL.md — personalidade e tom">
    Personalidade, tom e limites. Carregado em todas as sessões. Guia: [guia de personalidade do SOUL.md](/pt-BR/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — quem é o usuário">
    Quem é o usuário e como se dirigir a ele. Carregado em todas as sessões.
  </Accordion>
  <Accordion title="IDENTITY.md — nome, estilo e emoji">
    O nome, o estilo e o emoji do agente. Criado/atualizado durante o ritual de inicialização.
  </Accordion>
  <Accordion title="TOOLS.md — convenções das ferramentas locais">
    Observações sobre suas ferramentas e convenções locais. Não controla a disponibilidade das ferramentas; serve apenas como orientação.
  </Accordion>
  <Accordion title="HEARTBEAT.md — lista de verificação do Heartbeat">
    Pequena lista de verificação opcional para execuções de Heartbeat. Mantenha-a curta para evitar o consumo excessivo de tokens.
  </Accordion>
  <Accordion title="BOOT.md — lista de verificação de inicialização">
    Lista de verificação opcional de inicialização, executada automaticamente quando o Gateway reinicia (quando os [hooks internos](/pt-BR/automation/hooks) estão habilitados). Mantenha-a curta; use a ferramenta de mensagens para envios de saída.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — ritual da primeira execução">
    Ritual único da primeira execução. Criado apenas para um workspace totalmente novo. Exclua-o após a conclusão do ritual.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — registro diário de memória">
    Registro diário de memória (um arquivo por dia). Recomenda-se ler o registro de hoje e o de ontem no início da sessão.
  </Accordion>
  <Accordion title="MEMORY.md — memória de longo prazo selecionada (opcional)">
    Memória de longo prazo selecionada: fatos duradouros, preferências, decisões e resumos breves. Mantenha os registros detalhados em `memory/YYYY-MM-DD.md` para que as ferramentas de memória possam recuperá-los sob demanda sem inseri-los em todos os prompts. Carregue `MEMORY.md` apenas na sessão principal e privada (não em contextos compartilhados ou de grupo). Consulte [Memória](/pt-BR/concepts/memory) para ver o fluxo de trabalho e a descarga automática da memória.
  </Accordion>
  <Accordion title="skills/ — Skills do workspace (opcional)">
    Skills específicas do workspace. Local de Skills com a precedência mais alta para esse workspace, à frente das Skills de agente do projeto, Skills pessoais do agente, Skills gerenciadas, Skills incluídas e `skills.load.extraDirs` quando houver conflito de nomes.
  </Accordion>
  <Accordion title="canvas/ — arquivos da interface Canvas (opcional)">
    Arquivos da interface Canvas para exibições em Nodes (por exemplo, `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Se um arquivo de inicialização estiver ausente, o OpenClaw insere um marcador de “arquivo ausente” na sessão e continua. Arquivos de inicialização grandes são truncados quando inseridos; ajuste os limites com `agents.defaults.bootstrapMaxChars` (padrão: `20000`) e `agents.defaults.bootstrapTotalMaxChars` (padrão: `60000`). `openclaw setup` pode recriar os padrões ausentes sem sobrescrever arquivos existentes.
</Note>

## O que NÃO fica no workspace

Os itens a seguir ficam em `~/.openclaw/` e NÃO devem ser enviados ao repositório do workspace:

- `~/.openclaw/openclaw.json` (configuração)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (perfis de autenticação de modelos: OAuth + chaves de API)
- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` (registros de sessões, transcrições e estado de runtime por agente)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (conta, configuração, Skills, plugins e estado nativo de threads do runtime Codex por agente)
- `~/.openclaw/credentials/` (estado de canais/provedores e dados legados de importação do OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (fontes de migração legadas e artefatos de arquivamento/suporte)
- `~/.openclaw/skills/` (Skills gerenciadas)

Se você precisar migrar sessões ou configurações, copie-as separadamente e mantenha-as fora do controle de versão.

## Backup com Git (recomendado, privado)

Trate o workspace como memória privada. Coloque-o em um repositório Git **privado** para que tenha backup e possa ser recuperado.

Execute estas etapas na máquina em que o Gateway é executado (é nela que fica o workspace).

<Steps>
  <Step title="Inicialize o repositório">
    Se o Git estiver instalado, workspaces novos serão inicializados automaticamente. Se este workspace ainda não for um repositório, execute:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Adicionar workspace do agente"
    ```

  </Step>
  <Step title="Adicione um remoto privado">
    <Tabs>
      <Tab title="Interface web do GitHub">
        1. Crie um novo repositório **privado** no GitHub.
        2. Não o inicialize com um README (isso evita conflitos de mesclagem).
        3. Copie a URL HTTPS do remoto.
        4. Adicione o remoto e envie:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="CLI do GitHub (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="Interface web do GitLab">
        1. Crie um novo repositório **privado** no GitLab.
        2. Não o inicialize com um README (isso evita conflitos de mesclagem).
        3. Copie a URL HTTPS do remoto.
        4. Adicione o remoto e envie:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Atualizações contínuas">
    ```bash
    git status
    git add .
    git commit -m "Atualizar memória"
    git push
    ```
  </Step>
</Steps>

## Não envie segredos ao repositório

<Warning>
Mesmo em um repositório privado, evite armazenar segredos no workspace:

- Chaves de API, tokens OAuth, senhas ou credenciais privadas.
- Qualquer item em `~/.openclaw/`.
- Dumps brutos de conversas ou anexos sensíveis.

Se você precisar armazenar referências confidenciais, use placeholders e mantenha o segredo real em outro lugar (gerenciador de senhas, variáveis de ambiente ou `~/.openclaw/`).
</Warning>

Sugestão inicial de `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Como mover o workspace para uma nova máquina

<Steps>
  <Step title="Clone o repositório">
    Clone o repositório no caminho desejado (o padrão é `~/.openclaw/workspace`).
  </Step>
  <Step title="Atualize a configuração">
    Defina `agents.defaults.workspace` como esse caminho em `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Crie os arquivos ausentes">
    Execute `openclaw setup --workspace <path>` para criar os arquivos ausentes.
  </Step>
  <Step title="Copie as sessões (opcional)">
    Se você precisar das sessões, copie `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
    separadamente da máquina antiga. Copie `~/.openclaw/agents/<agentId>/sessions/`
    apenas quando também precisar de entradas de migração legadas ou artefatos de arquivamento/suporte.
  </Step>
</Steps>

## Observações avançadas

- O roteamento de múltiplos agentes pode usar workspaces diferentes para cada agente por meio de `agents.list[].workspace`. Consulte [Roteamento de canais](/pt-BR/channels/channel-routing) para ver a configuração de roteamento.
- Se `agents.defaults.sandbox` estiver habilitado, sessões que não sejam a principal poderão usar workspaces de sandbox por sessão em `agents.defaults.sandbox.workspaceRoot`.

## Relacionados

- [Heartbeat](/pt-BR/gateway/heartbeat) — arquivo HEARTBEAT.md do workspace
- [Isolamento por sandbox](/pt-BR/gateway/sandboxing) — acesso ao workspace em ambientes isolados por sandbox
- [Sessão](/pt-BR/concepts/session) — caminhos de armazenamento das sessões
- [Ordens permanentes](/pt-BR/automation/standing-orders) — instruções persistentes nos arquivos do workspace
