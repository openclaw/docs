---
read_when:
    - Você está migrando o OpenClaw para um novo notebook ou servidor
    - Você vem de outro sistema de agentes e quer manter o estado
    - Você está atualizando um Plugin no local
summary: 'Central de migração: importações entre sistemas, transferências entre máquinas e atualizações de Plugin'
title: Guia de migração
x-i18n:
    generated_at: "2026-05-02T05:50:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: e447e38cf0086603a7b30ee5204e63cc8227ebc7a56add26d06ac2798a23e26f
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw oferece suporte a três caminhos de migração: importar de outro sistema de agente, mover uma instalação existente para uma nova máquina e atualizar um Plugin no local.

## Importar de outro sistema de agente

Use os provedores de migração incluídos para trazer instruções, servidores MCP, Skills, configuração de modelo e chaves de API (opcional) para o OpenClaw. Os planos são pré-visualizados antes de qualquer alteração, segredos são redigidos nos relatórios, e a aplicação é respaldada por um backup verificado.

<CardGroup cols={2}>
  <Card title="Migrando do Claude" href="/pt-BR/install/migrating-claude" icon="brain">
    Importe o estado do Claude Code e do Claude Desktop, incluindo `CLAUDE.md`, servidores MCP, Skills e comandos de projeto.
  </Card>
  <Card title="Migrando do Hermes" href="/pt-BR/install/migrating-hermes" icon="feather">
    Importe configuração do Hermes, provedores, servidores MCP, memória, Skills e chaves `.env` compatíveis.
  </Card>
</CardGroup>

O ponto de entrada da CLI é [`openclaw migrate`](/pt-BR/cli/migrate). O onboarding também pode oferecer migração quando detecta uma origem conhecida (`openclaw onboard --flow import`).

## Mover o OpenClaw para uma nova máquina

Copie o **diretório de estado** (`~/.openclaw/` por padrão) e seu **workspace** para preservar:

- **Configuração** — `openclaw.json` e todas as configurações do Gateway.
- **Autenticação** — `auth-profiles.json` por agente (chaves de API mais OAuth), além de qualquer estado de canal ou provedor em `credentials/`.
- **Sessões** — histórico de conversas e estado do agente.
- **Estado do canal** — login do WhatsApp, sessão do Telegram e semelhantes.
- **Arquivos do workspace** — `MEMORY.md`, `USER.md`, Skills e prompts.

<Tip>
Execute `openclaw status` na máquina antiga para confirmar o caminho do diretório de estado. Perfis personalizados usam `~/.openclaw-<profile>/` ou um caminho definido via `OPENCLAW_STATE_DIR`.
</Tip>

### Etapas da migração

<Steps>
  <Step title="Pare o Gateway e faça backup">
    Na máquina **antiga**, pare o Gateway para que os arquivos não mudem durante a cópia e, em seguida, arquive:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Se você usa vários perfis (por exemplo, `~/.openclaw-work`), arquive cada um separadamente.

  </Step>

  <Step title="Instale o OpenClaw na nova máquina">
    [Instale](/pt-BR/install) a CLI (e o Node, se necessário) na nova máquina. Não há problema se o onboarding criar um `~/.openclaw/` novo. Você o substituirá em seguida.
  </Step>

  <Step title="Copie o diretório de estado e o workspace">
    Transfira o arquivo via `scp`, `rsync -a` ou uma unidade externa e, em seguida, extraia:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Garanta que diretórios ocultos foram incluídos e que a propriedade dos arquivos corresponda ao usuário que executará o Gateway.

  </Step>

  <Step title="Execute o Doctor e verifique">
    Na nova máquina, execute o [Doctor](/pt-BR/gateway/doctor) para aplicar migrações de configuração e reparar serviços:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Se Telegram ou Discord usa o fallback padrão de env (`TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN`), verifique se o `.env` do diretório de estado migrado contém essas chaves sem imprimir os valores secretos:

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor` também avisa quando uma conta padrão habilitada do Telegram ou Discord não tem token configurado e a variável de ambiente correspondente não está disponível para o processo do Doctor.

### Problemas comuns

<AccordionGroup>
  <Accordion title="Incompatibilidade de perfil ou diretório de estado">
    Se o Gateway antigo usava `--profile` ou `OPENCLAW_STATE_DIR` e o novo não usa, os canais aparecerão desconectados e as sessões ficarão vazias. Inicie o Gateway com o **mesmo** perfil ou diretório de estado que você migrou e execute `openclaw doctor` novamente.
  </Accordion>

  <Accordion title="Copiar apenas openclaw.json">
    O arquivo de configuração sozinho não é suficiente. Perfis de autenticação de modelo ficam em `agents/<agentId>/agent/auth-profiles.json`, e o estado de canais e provedores fica em `credentials/`. Sempre migre o diretório de estado **inteiro**.
  </Accordion>

  <Accordion title="Permissões e propriedade">
    Se você copiou como root ou trocou de usuário, o Gateway pode falhar ao ler credenciais. Garanta que o diretório de estado e o workspace pertençam ao usuário que executa o Gateway.
  </Accordion>

  <Accordion title="Modo remoto">
    Se sua UI aponta para um Gateway **remoto**, o host remoto é dono das sessões e do workspace. Migre o próprio host do Gateway, não seu laptop local. Consulte as [Perguntas frequentes](/pt-BR/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Segredos em backups">
    O diretório de estado contém perfis de autenticação, credenciais de canais e outros estados de provedores. Armazene backups criptografados, evite canais de transferência inseguros e rotacione chaves se suspeitar de exposição.
  </Accordion>
</AccordionGroup>

### Lista de verificação

Na nova máquina, confirme:

- [ ] `openclaw status` mostra o Gateway em execução.
- [ ] Os canais ainda estão conectados (sem necessidade de parear novamente).
- [ ] O dashboard abre e mostra as sessões existentes.
- [ ] Arquivos do workspace (memória, configurações) estão presentes.

## Atualizar um Plugin no local

Atualizações de Plugin no local preservam o mesmo ID de Plugin e as mesmas chaves de configuração, mas podem mover o estado em disco para o layout atual. Guias de atualização específicos de Plugin ficam junto aos seus canais:

- [Migração do Matrix](/pt-BR/channels/matrix-migration): limites de recuperação de estado criptografado, comportamento de snapshot automático e comandos de recuperação manual.

## Relacionado

- [`openclaw migrate`](/pt-BR/cli/migrate): referência da CLI para importações entre sistemas.
- [Visão geral da instalação](/pt-BR/install): todos os métodos de instalação.
- [Doctor](/pt-BR/gateway/doctor): verificação de integridade pós-migração.
- [Desinstalar](/pt-BR/install/uninstall): remover o OpenClaw completamente.
