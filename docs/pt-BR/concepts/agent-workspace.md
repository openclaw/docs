---
read_when:
    - Você precisa explicar o workspace do agente ou o layout de arquivos dele
    - Você quer fazer backup ou migrar um workspace de agente
sidebarTitle: Agent workspace
summary: 'Espaço de trabalho do agente: localização, layout e estratégia de backup'
title: Espaço de trabalho do agente
x-i18n:
    generated_at: "2026-06-27T17:23:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6020aa96b2aa829a9684164994d1fb1fb1b31157c47b60e947ad82f9f5508e1c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

O espaço de trabalho é a casa do agente. Ele é o único diretório de trabalho usado para ferramentas de arquivo e para o contexto do espaço de trabalho. Mantenha-o privado e trate-o como memória.

Isso é separado de `~/.openclaw/`, que armazena configuração, credenciais e sessões.

<Warning>
O espaço de trabalho é o **cwd padrão**, não uma sandbox rígida. As ferramentas resolvem caminhos relativos a partir do espaço de trabalho, mas caminhos absolutos ainda podem alcançar outros lugares no host, a menos que a sandbox esteja habilitada. Se você precisar de isolamento, use [`agents.defaults.sandbox`](/pt-BR/gateway/sandboxing) (e/ou a configuração de sandbox por agente).

Quando a sandbox está habilitada e `workspaceAccess` não é `"rw"`, as ferramentas operam dentro de um espaço de trabalho em sandbox em `~/.openclaw/sandboxes`, não no espaço de trabalho do host.
</Warning>

## Local padrão

- Padrão: `~/.openclaw/workspace`
- Se `OPENCLAW_PROFILE` estiver definido e não for `"default"`, o padrão passa a ser `~/.openclaw/workspace-<profile>`.
- Substitua em `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` ou `openclaw setup` criarão o espaço de trabalho e inicializarão os arquivos de bootstrap se eles estiverem ausentes.

<Note>
As cópias de inicialização da sandbox aceitam apenas arquivos regulares dentro do espaço de trabalho; aliases de symlink/hardlink que resolvem para fora do espaço de trabalho de origem são ignorados.
</Note>

Se você já gerencia os arquivos do espaço de trabalho por conta própria, pode desabilitar a criação de arquivos de bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Pastas extras do espaço de trabalho

Instalações antigas podem ter criado `~/openclaw`. Manter vários diretórios de espaço de trabalho pode causar confusão de autenticação ou divergência de estado, porque apenas um espaço de trabalho fica ativo por vez.

<Note>
**Recomendação:** mantenha um único espaço de trabalho ativo. Se você não usa mais as pastas extras, arquive-as ou mova-as para a Lixeira (por exemplo, `trash ~/openclaw`). Se você mantém vários espaços de trabalho intencionalmente, confira se `agents.defaults.workspace` aponta para o ativo.

`openclaw doctor` avisa quando detecta diretórios extras de espaço de trabalho.
</Note>

## Mapa de arquivos do espaço de trabalho

Estes são os arquivos padrão que o OpenClaw espera dentro do espaço de trabalho:

<AccordionGroup>
  <Accordion title="AGENTS.md - instruções operacionais">
    Instruções operacionais para o agente e como ele deve usar a memória. Carregado no início de cada sessão. Bom lugar para regras, prioridades e detalhes de "como se comportar".
  </Accordion>
  <Accordion title="SOUL.md - persona e tom">
    Persona, tom e limites. Carregado em todas as sessões. Guia: [guia de personalidade SOUL.md](/pt-BR/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - quem é o usuário">
    Quem é o usuário e como se dirigir a ele. Carregado em todas as sessões.
  </Accordion>
  <Accordion title="IDENTITY.md - nome, vibe, emoji">
    O nome, a vibe e o emoji do agente. Criado/atualizado durante o ritual de bootstrap.
  </Accordion>
  <Accordion title="TOOLS.md - convenções de ferramentas locais">
    Observações sobre suas ferramentas e convenções locais. Não controla a disponibilidade das ferramentas; serve apenas como orientação.
  </Accordion>
  <Accordion title="HEARTBEAT.md - checklist de Heartbeat">
    Pequeno checklist opcional para execuções de Heartbeat. Mantenha-o curto para evitar gasto de tokens.
  </Accordion>
  <Accordion title="BOOT.md - checklist de inicialização">
    Checklist opcional de inicialização executado automaticamente na reinicialização do Gateway (quando [hooks internos](/pt-BR/automation/hooks) estão habilitados). Mantenha-o curto; use a ferramenta de mensagem para envios de saída.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - ritual da primeira execução">
    Ritual único da primeira execução. Criado apenas para um espaço de trabalho totalmente novo. Exclua-o depois que o ritual for concluído.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - registro diário de memória">
    Registro diário de memória (um arquivo por dia). Recomendado ler hoje + ontem no início da sessão.
  </Accordion>
  <Accordion title="MEMORY.md - memória de longo prazo curada (opcional)">
    Memória de longo prazo curada: fatos duráveis, preferências, decisões e resumos curtos. Mantenha registros detalhados em `memory/YYYY-MM-DD.md` para que as ferramentas de memória possam recuperá-los sob demanda sem injetá-los em cada prompt. Carregue `MEMORY.md` apenas na sessão principal e privada (não em contextos compartilhados/de grupo). Consulte [Memória](/pt-BR/concepts/memory) para ver o fluxo de trabalho e o flush automático de memória.
  </Accordion>
  <Accordion title="skills/ - Skills do espaço de trabalho (opcional)">
    Skills específicas do espaço de trabalho. Local de Skills com maior precedência para esse espaço de trabalho. Sobrescreve Skills de agente do projeto, Skills pessoais de agente, Skills gerenciadas, Skills incluídas e `skills.load.extraDirs` quando os nomes entram em conflito.
  </Accordion>
  <Accordion title="canvas/ - arquivos de interface do usuário do Canvas (opcional)">
    Arquivos de interface do usuário do Canvas para exibições de nós (por exemplo, `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Se algum arquivo de bootstrap estiver ausente, o OpenClaw injeta um marcador de "arquivo ausente" na sessão e continua. Arquivos de bootstrap grandes são truncados quando injetados; ajuste os limites com `agents.defaults.bootstrapMaxChars` (padrão: 20000) e `agents.defaults.bootstrapTotalMaxChars` (padrão: 60000). `openclaw setup` pode recriar padrões ausentes sem sobrescrever arquivos existentes.
</Note>

## O que NÃO fica no espaço de trabalho

Estes ficam em `~/.openclaw/` e NÃO devem ser commitados no repositório do espaço de trabalho:

- `~/.openclaw/openclaw.json` (configuração)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (perfis de autenticação de modelo: OAuth + chaves de API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (conta de runtime Codex por agente, configuração, Skills, Plugins e estado nativo de threads)
- `~/.openclaw/credentials/` (estado de canal/provedor mais dados legados de importação OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transcrições de sessão + metadados)
- `~/.openclaw/skills/` (Skills gerenciadas)

Se você precisar migrar sessões ou configuração, copie-as separadamente e mantenha-as fora do controle de versão.

## Backup com git (recomendado, privado)

Trate o espaço de trabalho como memória privada. Coloque-o em um repositório git **privado** para que ele tenha backup e possa ser recuperado.

Execute estas etapas na máquina onde o Gateway roda (é onde o espaço de trabalho fica).

<Steps>
  <Step title="Inicializar o repositório">
    Se o git estiver instalado, espaços de trabalho novos são inicializados automaticamente. Se este espaço de trabalho ainda não for um repositório, execute:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Adicionar um remote privado">
    <Tabs>
      <Tab title="Interface web do GitHub">
        1. Crie um novo repositório **privado** no GitHub.
        2. Não inicialize com um README (evita conflitos de merge).
        3. Copie a URL remota HTTPS.
        4. Adicione o remote e faça push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="Interface web do GitLab">
        1. Crie um novo repositório **privado** no GitLab.
        2. Não inicialize com um README (evita conflitos de merge).
        3. Copie a URL remota HTTPS.
        4. Adicione o remote e faça push:

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
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## Não commite segredos

<Warning>
Mesmo em um repositório privado, evite armazenar segredos no espaço de trabalho:

- Chaves de API, tokens OAuth, senhas ou credenciais privadas.
- Qualquer coisa em `~/.openclaw/`.
- Despejos brutos de chats ou anexos sensíveis.

Se você precisar armazenar referências sensíveis, use placeholders e mantenha o segredo real em outro lugar (gerenciador de senhas, variáveis de ambiente ou `~/.openclaw/`).
</Warning>

Modelo inicial sugerido de `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Mover o espaço de trabalho para uma nova máquina

<Steps>
  <Step title="Clonar o repositório">
    Clone o repositório para o caminho desejado (padrão `~/.openclaw/workspace`).
  </Step>
  <Step title="Atualizar a configuração">
    Defina `agents.defaults.workspace` para esse caminho em `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Inicializar arquivos ausentes">
    Execute `openclaw setup --workspace <path>` para inicializar quaisquer arquivos ausentes.
  </Step>
  <Step title="Copiar sessões (opcional)">
    Se você precisar das sessões, copie `~/.openclaw/agents/<agentId>/sessions/` da máquina antiga separadamente.
  </Step>
</Steps>

## Observações avançadas

- O roteamento multiagente pode usar espaços de trabalho diferentes por agente. Consulte [Roteamento de canais](/pt-BR/channels/channel-routing) para ver a configuração de roteamento.
- Se `agents.defaults.sandbox` estiver habilitado, sessões não principais podem usar espaços de trabalho de sandbox por sessão em `agents.defaults.sandbox.workspaceRoot`.

## Relacionado

- [Heartbeat](/pt-BR/gateway/heartbeat) - arquivo de espaço de trabalho HEARTBEAT.md
- [Sandboxing](/pt-BR/gateway/sandboxing) - acesso ao espaço de trabalho em ambientes com sandbox
- [Sessão](/pt-BR/concepts/session) - caminhos de armazenamento de sessão
- [Ordens permanentes](/pt-BR/automation/standing-orders) - instruções persistentes em arquivos do espaço de trabalho
