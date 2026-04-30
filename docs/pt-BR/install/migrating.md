---
read_when:
    - Você está migrando o OpenClaw para um novo notebook ou servidor
    - Você vem de outro sistema de agentes e quer manter o estado
    - Você está atualizando um Plugin no local
summary: 'Central de migração: importações entre sistemas, transferências entre máquinas e atualizações de Plugin'
title: Guia de migração
x-i18n:
    generated_at: "2026-04-30T09:55:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2a1dc86ed367a0b92cdc0d5189123bb045d327be944516f564dac723f324c97
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw oferece suporte a três caminhos de migração: importar de outro sistema de agentes, mover uma instalação existente para uma nova máquina e atualizar um Plugin no local.

## Importar de outro sistema de agentes

Use os provedores de migração incluídos para trazer instruções, servidores MCP, Skills, configuração de modelo e chaves de API (com consentimento) para o OpenClaw. Os planos são visualizados antes de qualquer alteração, os segredos são redigidos nos relatórios e a aplicação é respaldada por um backup verificado.

<CardGroup cols={2}>
  <Card title="Migrando do Claude" href="/pt-BR/install/migrating-claude" icon="brain">
    Importe o estado do Claude Code e do Claude Desktop, incluindo `CLAUDE.md`, servidores MCP, Skills e comandos de projeto.
  </Card>
  <Card title="Migrando do Hermes" href="/pt-BR/install/migrating-hermes" icon="feather">
    Importe a configuração do Hermes, provedores, servidores MCP, memória, Skills e chaves `.env` compatíveis.
  </Card>
</CardGroup>

O ponto de entrada da CLI é [`openclaw migrate`](/pt-BR/cli/migrate). A integração inicial também pode oferecer migração quando detecta uma origem conhecida (`openclaw onboard --flow import`).

## Mover o OpenClaw para uma nova máquina

Copie o **diretório de estado** (`~/.openclaw/` por padrão) e seu **workspace** para preservar:

- **Configuração** — `openclaw.json` e todas as configurações do Gateway.
- **Autenticação** — `auth-profiles.json` por agente (chaves de API mais OAuth), além de qualquer estado de canal ou provedor em `credentials/`.
- **Sessões** — histórico de conversas e estado do agente.
- **Estado do canal** — login do WhatsApp, sessão do Telegram e similares.
- **Arquivos do workspace** — `MEMORY.md`, `USER.md`, Skills e prompts.

<Tip>
Execute `openclaw status` na máquina antiga para confirmar o caminho do diretório de estado. Perfis personalizados usam `~/.openclaw-<profile>/` ou um caminho definido por `OPENCLAW_STATE_DIR`.
</Tip>

### Etapas de migração

<Steps>
  <Step title="Pare o Gateway e faça backup">
    Na máquina **antiga**, pare o Gateway para que os arquivos não mudem durante a cópia; em seguida, arquive:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Se você usa vários perfis (por exemplo, `~/.openclaw-work`), arquive cada um separadamente.

  </Step>

  <Step title="Instale o OpenClaw na nova máquina">
    [Instale](/pt-BR/install) a CLI (e o Node, se necessário) na nova máquina. Não há problema se a integração inicial criar um `~/.openclaw/` novo. Você o substituirá a seguir.
  </Step>

  <Step title="Copie o diretório de estado e o workspace">
    Transfira o arquivo via `scp`, `rsync -a` ou uma unidade externa; em seguida, extraia:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Garanta que diretórios ocultos tenham sido incluídos e que a propriedade dos arquivos corresponda ao usuário que executará o Gateway.

  </Step>

  <Step title="Execute o doctor e verifique">
    Na nova máquina, execute o [Doctor](/pt-BR/gateway/doctor) para aplicar migrações de configuração e reparar serviços:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

### Armadilhas comuns

<AccordionGroup>
  <Accordion title="Incompatibilidade de perfil ou state-dir">
    Se o Gateway antigo usava `--profile` ou `OPENCLAW_STATE_DIR` e o novo não usa, os canais aparecerão desconectados e as sessões estarão vazias. Inicie o Gateway com o **mesmo** perfil ou state-dir que você migrou; em seguida, execute `openclaw doctor` novamente.
  </Accordion>

  <Accordion title="Copiar apenas openclaw.json">
    O arquivo de configuração sozinho não é suficiente. Perfis de autenticação de modelo ficam em `agents/<agentId>/agent/auth-profiles.json`, e o estado de canais e provedores fica em `credentials/`. Sempre migre o diretório de estado **inteiro**.
  </Accordion>

  <Accordion title="Permissões e propriedade">
    Se você copiou como root ou trocou de usuário, o Gateway pode falhar ao ler credenciais. Garanta que o diretório de estado e o workspace pertençam ao usuário que executa o Gateway.
  </Accordion>

  <Accordion title="Modo remoto">
    Se sua UI aponta para um Gateway **remoto**, o host remoto é o dono das sessões e do workspace. Migre o próprio host do Gateway, não seu laptop local. Consulte as [Perguntas frequentes](/pt-BR/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Segredos em backups">
    O diretório de estado contém perfis de autenticação, credenciais de canais e outros estados de provedores. Armazene backups criptografados, evite canais de transferência inseguros e rotacione as chaves se suspeitar de exposição.
  </Accordion>
</AccordionGroup>

### Lista de verificação

Na nova máquina, confirme:

- [ ] `openclaw status` mostra o Gateway em execução.
- [ ] Os canais ainda estão conectados (sem necessidade de pareamento novamente).
- [ ] O painel abre e mostra sessões existentes.
- [ ] Os arquivos do workspace (memória, configurações) estão presentes.

## Atualizar um Plugin no local

Atualizações de Plugin no local preservam o mesmo id de Plugin e as chaves de configuração, mas podem mover o estado em disco para o layout atual. Guias de atualização específicos de Plugin ficam junto aos seus canais:

- [Migração do Matrix](/pt-BR/channels/matrix-migration): limites de recuperação de estado criptografado, comportamento de snapshot automático e comandos de recuperação manual.

## Relacionados

- [`openclaw migrate`](/pt-BR/cli/migrate): referência da CLI para importações entre sistemas.
- [Visão geral da instalação](/pt-BR/install): todos os métodos de instalação.
- [Doctor](/pt-BR/gateway/doctor): verificação de integridade pós-migração.
- [Desinstalar](/pt-BR/install/uninstall): remover o OpenClaw de forma limpa.
