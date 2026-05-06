---
read_when:
    - Você precisa explicar o espaço de trabalho do agente ou sua estrutura de arquivos
    - Você quer fazer backup ou migrar um espaço de trabalho de agente
sidebarTitle: Agent workspace
summary: 'Espaço de trabalho do agente: localização, organização e estratégia de cópia de segurança'
title: Espaço de trabalho do agente
x-i18n:
    generated_at: "2026-05-06T05:49:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5c4c55f3cda5dcf6b763f8e59fa926283cee18270a58dbd62593947a55e67c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

O espaço de trabalho é a casa do agente. Ele é o único diretório de trabalho usado para ferramentas de arquivo e para o contexto do espaço de trabalho. Mantenha-o privado e trate-o como memória.

Isso é separado de `~/.openclaw/`, que armazena configuração, credenciais e sessões.

<Warning>
O espaço de trabalho é o **cwd padrão**, não um sandbox rígido. As ferramentas resolvem caminhos relativos em relação ao espaço de trabalho, mas caminhos absolutos ainda podem acessar outros locais no host, a menos que o sandboxing esteja habilitado. Se você precisar de isolamento, use [`agents.defaults.sandbox`](/pt-BR/gateway/sandboxing) (e/ou a configuração de sandbox por agente).

Quando o sandboxing está habilitado e `workspaceAccess` não é `"rw"`, as ferramentas operam dentro de um espaço de trabalho em sandbox em `~/.openclaw/sandboxes`, não no espaço de trabalho do seu host.
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

`openclaw onboard`, `openclaw configure` ou `openclaw setup` criarão o espaço de trabalho e adicionarão os arquivos iniciais se eles estiverem ausentes.

<Note>
As cópias de seed do sandbox só aceitam arquivos regulares dentro do espaço de trabalho; aliases de symlink/hardlink que resolvem para fora do espaço de trabalho de origem são ignorados.
</Note>

Se você já gerencia os arquivos do espaço de trabalho por conta própria, pode desabilitar a criação de arquivos de bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Pastas extras do espaço de trabalho

Instalações mais antigas podem ter criado `~/openclaw`. Manter vários diretórios de espaço de trabalho pode causar confusão de autenticação ou desvio de estado, porque apenas um espaço de trabalho fica ativo por vez.

<Note>
**Recomendação:** mantenha um único espaço de trabalho ativo. Se você não usa mais as pastas extras, arquive-as ou mova-as para a Lixeira (por exemplo, `trash ~/openclaw`). Se você mantiver vários espaços de trabalho intencionalmente, confira se `agents.defaults.workspace` aponta para o ativo.

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
    Observações sobre suas ferramentas locais e convenções. Não controla a disponibilidade de ferramentas; é apenas orientação.
  </Accordion>
  <Accordion title="HEARTBEAT.md - checklist de Heartbeat">
    Pequeno checklist opcional para execuções de Heartbeat. Mantenha-o curto para evitar gasto de tokens.
  </Accordion>
  <Accordion title="BOOT.md - checklist de inicialização">
    Checklist opcional de inicialização executado automaticamente no reinício do Gateway (quando [hooks internos](/pt-BR/automation/hooks) estão habilitados). Mantenha-o curto; use a ferramenta de mensagem para envios de saída.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - ritual da primeira execução">
    Ritual único da primeira execução. Criado apenas para um espaço de trabalho totalmente novo. Exclua-o depois que o ritual estiver completo.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - registro diário de memória">
    Registro diário de memória (um arquivo por dia). Recomendado ler hoje + ontem no início da sessão.
  </Accordion>
  <Accordion title="MEMORY.md - memória de longo prazo curada (opcional)">
    Memória de longo prazo curada. Carregue apenas na sessão principal e privada (não em contextos compartilhados/de grupo). Consulte [Memória](/pt-BR/concepts/memory) para ver o fluxo de trabalho e o flush automático de memória.
  </Accordion>
  <Accordion title="skills/ - Skills do espaço de trabalho (opcional)">
    Skills específicas do espaço de trabalho. Local de Skills de maior precedência para esse espaço de trabalho. Substitui Skills de agente do projeto, Skills pessoais do agente, Skills gerenciadas, Skills empacotadas e `skills.load.extraDirs` quando há colisão de nomes.
  </Accordion>
  <Accordion title="canvas/ - arquivos de UI do Canvas (opcional)">
    Arquivos de UI do Canvas para exibições de nodes (por exemplo, `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Se algum arquivo de bootstrap estiver ausente, o OpenClaw injeta um marcador de "arquivo ausente" na sessão e continua. Arquivos de bootstrap grandes são truncados quando injetados; ajuste os limites com `agents.defaults.bootstrapMaxChars` (padrão: 12000) e `agents.defaults.bootstrapTotalMaxChars` (padrão: 60000). `openclaw setup` pode recriar padrões ausentes sem sobrescrever arquivos existentes.
</Note>

## O que NÃO fica no espaço de trabalho

Estes ficam em `~/.openclaw/` e NÃO devem ser commitados no repositório do espaço de trabalho:

- `~/.openclaw/openclaw.json` (configuração)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (perfis de autenticação de modelo: OAuth + chaves de API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (conta, configuração, Skills, Plugins e estado nativo de threads do runtime Codex por agente)
- `~/.openclaw/credentials/` (estado de canal/provedor mais dados legados de importação OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transcrições de sessão + metadados)
- `~/.openclaw/skills/` (Skills gerenciadas)

Se você precisar migrar sessões ou configuração, copie-as separadamente e mantenha-as fora do controle de versão.

## Backup com Git (recomendado, privado)

Trate o espaço de trabalho como memória privada. Coloque-o em um repositório git **privado** para que ele tenha backup e possa ser recuperado.

Execute estas etapas na máquina em que o Gateway roda (é onde o espaço de trabalho fica).

<Steps>
  <Step title="Inicialize o repositório">
    Se git estiver instalado, espaços de trabalho totalmente novos são inicializados automaticamente. Se este espaço de trabalho ainda não for um repositório, execute:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Adicione um remoto privado">
    <Tabs>
      <Tab title="UI web do GitHub">
        1. Crie um novo repositório **privado** no GitHub.
        2. Não inicialize com um README (evita conflitos de merge).
        3. Copie a URL remota HTTPS.
        4. Adicione o remoto e faça push:

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
      <Tab title="UI web do GitLab">
        1. Crie um novo repositório **privado** no GitLab.
        2. Não inicialize com um README (evita conflitos de merge).
        3. Copie a URL remota HTTPS.
        4. Adicione o remoto e faça push:

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
- Dumps brutos de chats ou anexos sensíveis.

Se você precisar armazenar referências sensíveis, use placeholders e mantenha o segredo real em outro lugar (gerenciador de senhas, variáveis de ambiente ou `~/.openclaw/`).
</Warning>

Sugestão inicial de `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Movendo o espaço de trabalho para uma nova máquina

<Steps>
  <Step title="Clone o repositório">
    Clone o repositório para o caminho desejado (padrão `~/.openclaw/workspace`).
  </Step>
  <Step title="Atualize a configuração">
    Defina `agents.defaults.workspace` para esse caminho em `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Adicione arquivos ausentes">
    Execute `openclaw setup --workspace <path>` para adicionar quaisquer arquivos ausentes.
  </Step>
  <Step title="Copie sessões (opcional)">
    Se você precisar de sessões, copie `~/.openclaw/agents/<agentId>/sessions/` separadamente da máquina antiga.
  </Step>
</Steps>

## Observações avançadas

- O roteamento multiagente pode usar espaços de trabalho diferentes por agente. Consulte [Roteamento de canais](/pt-BR/channels/channel-routing) para a configuração de roteamento.
- Se `agents.defaults.sandbox` estiver habilitado, sessões não principais podem usar espaços de trabalho de sandbox por sessão em `agents.defaults.sandbox.workspaceRoot`.

## Relacionados

- [Heartbeat](/pt-BR/gateway/heartbeat) - arquivo de espaço de trabalho HEARTBEAT.md
- [Sandboxing](/pt-BR/gateway/sandboxing) - acesso ao espaço de trabalho em ambientes com sandbox
- [Sessão](/pt-BR/concepts/session) - caminhos de armazenamento de sessão
- [Ordens permanentes](/pt-BR/automation/standing-orders) - instruções persistentes em arquivos do espaço de trabalho
