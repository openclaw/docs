---
read_when:
    - Você precisa explicar o workspace do agente ou seu layout de arquivos
    - Você quer fazer backup ou migrar um workspace de agente
sidebarTitle: Agent workspace
summary: 'Workspace do agente: localização, layout e estratégia de backup'
title: Workspace do agente
x-i18n:
    generated_at: "2026-04-26T11:26:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35d59d1f0dec05db30f9166a43bfa519d7299b08d093bbeb905d8f83e5cd022a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

O workspace é a casa do agente. Ele é o único diretório de trabalho usado pelas ferramentas de arquivo e para o contexto do workspace. Mantenha-o privado e trate-o como memória.

Isso é separado de `~/.openclaw/`, que armazena config, credenciais e sessões.

<Warning>
O workspace é o **cwd padrão**, não um sandbox rígido. As ferramentas resolvem caminhos relativos em relação ao workspace, mas caminhos absolutos ainda podem alcançar outros locais no host, a menos que o sandboxing esteja ativado. Se você precisar de isolamento, use [`agents.defaults.sandbox`](/pt-BR/gateway/sandboxing) (e/ou config de sandbox por agente).

Quando o sandboxing está ativado e `workspaceAccess` não é `"rw"`, as ferramentas operam dentro de um workspace de sandbox em `~/.openclaw/sandboxes`, não no workspace do host.
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

`openclaw onboard`, `openclaw configure` ou `openclaw setup` criarão o workspace e inicializarão os arquivos de bootstrap se estiverem ausentes.

<Note>
Cópias de inicialização do sandbox aceitam apenas arquivos regulares dentro do workspace; aliases de symlink/hardlink que resolvem para fora do workspace de origem são ignorados.
</Note>

Se você já gerencia os arquivos do workspace por conta própria, pode desativar a criação de arquivos de bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Pastas extras de workspace

Instalações mais antigas podem ter criado `~/openclaw`. Manter vários diretórios de workspace pode causar deriva confusa de autenticação ou estado, porque apenas um workspace fica ativo por vez.

<Note>
**Recomendação:** mantenha um único workspace ativo. Se você não usa mais as pastas extras, arquive-as ou mova-as para a Lixeira (por exemplo `trash ~/openclaw`). Se você mantiver intencionalmente vários workspaces, garanta que `agents.defaults.workspace` aponte para o ativo.

`openclaw doctor` avisa quando detecta diretórios extras de workspace.
</Note>

## Mapa de arquivos do workspace

Estes são os arquivos padrão que o OpenClaw espera dentro do workspace:

<AccordionGroup>
  <Accordion title="AGENTS.md — instruções operacionais">
    Instruções operacionais para o agente e como ele deve usar a memória. Carregado no início de toda sessão. Bom lugar para regras, prioridades e detalhes de "como se comportar".
  </Accordion>
  <Accordion title="SOUL.md — persona e tom">
    Persona, tom e limites. Carregado em toda sessão. Guia: [guia de personalidade SOUL.md](/pt-BR/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — quem é o usuário">
    Quem é o usuário e como se dirigir a ele. Carregado em toda sessão.
  </Accordion>
  <Accordion title="IDENTITY.md — nome, vibe, emoji">
    O nome, a vibe e o emoji do agente. Criado/atualizado durante o ritual de bootstrap.
  </Accordion>
  <Accordion title="TOOLS.md — convenções de ferramentas locais">
    Observações sobre suas ferramentas locais e convenções. Não controla a disponibilidade de ferramentas; é apenas orientação.
  </Accordion>
  <Accordion title="HEARTBEAT.md — checklist de Heartbeat">
    Checklist pequeno opcional para execuções de Heartbeat. Mantenha-o curto para evitar gasto de tokens.
  </Accordion>
  <Accordion title="BOOT.md — checklist de inicialização">
    Checklist de inicialização opcional executado automaticamente ao reiniciar o Gateway (quando [hooks internos](/pt-BR/automation/hooks) estão ativados). Mantenha-o curto; use a ferramenta de mensagem para envios de saída.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — ritual da primeira execução">
    Ritual único da primeira execução. Só é criado para um workspace totalmente novo. Exclua-o depois que o ritual for concluído.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — log diário de memória">
    Log diário de memória (um arquivo por dia). Recomendado ler o de hoje + o de ontem no início da sessão.
  </Accordion>
  <Accordion title="MEMORY.md — memória de longo prazo curada (opcional)">
    Memória de longo prazo curada. Carregue apenas na sessão principal e privada (não em contextos compartilhados/de grupo). Veja [Memória](/pt-BR/concepts/memory) para o fluxo de trabalho e o descarregamento automático de memória.
  </Accordion>
  <Accordion title="skills/ — Skills do workspace (opcional)">
    Skills específicos do workspace. Local de Skills de maior precedência para esse workspace. Substitui Skills de agente do projeto, Skills de agente pessoais, Skills gerenciados, Skills incluídos no pacote e `skills.load.extraDirs` quando há colisão de nomes.
  </Accordion>
  <Accordion title="canvas/ — arquivos da UI Canvas (opcional)">
    Arquivos da UI Canvas para telas de node (por exemplo `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Se algum arquivo de bootstrap estiver ausente, o OpenClaw injeta um marcador de "arquivo ausente" na sessão e continua. Arquivos grandes de bootstrap são truncados ao serem injetados; ajuste os limites com `agents.defaults.bootstrapMaxChars` (padrão: 12000) e `agents.defaults.bootstrapTotalMaxChars` (padrão: 60000). `openclaw setup` pode recriar padrões ausentes sem sobrescrever arquivos existentes.
</Note>

## O que NÃO está no workspace

Estes ficam em `~/.openclaw/` e NÃO devem ser commitados no repo do workspace:

- `~/.openclaw/openclaw.json` (config)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (perfis de autenticação de modelo: OAuth + chaves de API)
- `~/.openclaw/credentials/` (estado de canal/provider mais dados legados de importação de OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transcrições de sessão + metadados)
- `~/.openclaw/skills/` (Skills gerenciados)

Se você precisar migrar sessões ou config, copie-os separadamente e mantenha-os fora do controle de versão.

## Backup com Git (recomendado, privado)

Trate o workspace como memória privada. Coloque-o em um repo git **privado** para que tenha backup e seja recuperável.

Execute estas etapas na máquina onde o Gateway roda (é lá que o workspace fica).

<Steps>
  <Step title="Inicialize o repo">
    Se o git estiver instalado, workspaces totalmente novos são inicializados automaticamente. Se este workspace ainda não for um repo, execute:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Adicione um remoto privado">
    <Tabs>
      <Tab title="GitHub web UI">
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
      <Tab title="GitLab web UI">
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

## Não faça commit de segredos

<Warning>
Mesmo em um repo privado, evite armazenar segredos no workspace:

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

## Movendo o workspace para uma nova máquina

<Steps>
  <Step title="Clone o repo">
    Clone o repo para o caminho desejado (padrão `~/.openclaw/workspace`).
  </Step>
  <Step title="Atualize a config">
    Defina `agents.defaults.workspace` para esse caminho em `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Inicialize arquivos ausentes">
    Execute `openclaw setup --workspace <path>` para inicializar quaisquer arquivos ausentes.
  </Step>
  <Step title="Copie sessões (opcional)">
    Se você precisar de sessões, copie `~/.openclaw/agents/<agentId>/sessions/` da máquina antiga separadamente.
  </Step>
</Steps>

## Observações avançadas

- O roteamento de vários agentes pode usar workspaces diferentes por agente. Veja [Roteamento de canal](/pt-BR/channels/channel-routing) para a configuração de roteamento.
- Se `agents.defaults.sandbox` estiver ativado, sessões não principais podem usar workspaces de sandbox por sessão em `agents.defaults.sandbox.workspaceRoot`.

## Relacionado

- [Heartbeat](/pt-BR/gateway/heartbeat) — arquivo de workspace HEARTBEAT.md
- [Sandboxing](/pt-BR/gateway/sandboxing) — acesso ao workspace em ambientes com sandbox
- [Sessão](/pt-BR/concepts/session) — caminhos de armazenamento de sessão
- [Ordens permanentes](/pt-BR/automation/standing-orders) — instruções persistentes em arquivos do workspace
