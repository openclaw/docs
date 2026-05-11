---
read_when:
    - Entendendo os resultados de verificação e moderação do ClawHub
    - Reportar uma Skill ou pacote
    - Recuperando uma listagem retida, oculta ou bloqueada
summary: Comportamento de confiança, verificação, geração de relatórios, recurso e moderação do ClawHub.
x-i18n:
    generated_at: "2026-05-11T20:24:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf88073ce581f25c93b2fe0067ebd2bb1a481c8c927d65a06943a38d33e3425e
    source_path: clawhub/security.md
    workflow: 16
---

# Segurança + Moderação

O ClawHub é aberto para publicação, mas as listagens públicas ainda passam por controles de confiança, varredura, denúncia e moderação. O objetivo é prático: ajudar os usuários a inspecionar o que instalam, oferecer aos publicadores um caminho de recuperação para falsos positivos e manter pacotes abusivos fora da descoberta pública.

Veja também [Uso aceitável](/pt-BR/clawhub/acceptable-usage).

## O que os usuários podem inspecionar

Antes de instalar uma skill ou plugin, verifique a listagem dela no ClawHub para:

- atribuição de proprietário e origem
- versão mais recente e changelog
- variáveis de ambiente ou permissões necessárias
- metadados de compatibilidade para plugins
- status de varredura ou moderação
- denúncias, comentários, estrelas, downloads e sinais de instalação quando exibidos

Instale apenas conteúdo que você entende e em que confia.

## Estados de varredura

O ClawHub pode mostrar resultados de varredura ou moderação em páginas públicas e diagnósticos visíveis ao proprietário.

Resultados comuns incluem:

- `clean`: nenhum problema bloqueante foi encontrado.
- `suspicious`: a versão exige cautela ou revisão.
- `malicious`: a versão é considerada insegura.
- `pending`: as verificações ainda não foram concluídas.
- `held`, `quarantined`, `revoked` ou `hidden`: a versão não está totalmente disponível em superfícies públicas de instalação.

A redação exata pode variar conforme a superfície, mas o significado prático é o mesmo: se uma versão estiver retida ou bloqueada, os usuários não devem instalá-la até que o proprietário resolva o problema ou a moderação a restaure.

## Skills

As varreduras de skills analisam o pacote de skill publicado, os metadados, os requisitos declarados e instruções suspeitas.

O ClawHub dá atenção especial a incompatibilidades entre o que uma skill declara e o que ela parece fazer. Por exemplo, uma skill que referencia uma chave de API necessária deve declarar esse requisito em `SKILL.md` para que os usuários possam vê-lo antes de instalar.

As constatações de varredura são baseadas em artefatos. Comportamentos esperados de provedores, como credenciais de API declaradas, callbacks OAuth em localhost, limpeza de desinstalação com escopo definido, codificação de Basic Auth ou uploads de arquivos selecionados pelo usuário para o provedor declarado, são tratados de forma diferente de encaminhamento oculto de credenciais, acesso amplo a arquivos privados, destinos de rede não relacionados ou abuso furtivo do navegador.

Veja [Formato de skill](/pt-BR/clawhub/skill-format).

## Plugins

As versões de plugins incluem metadados de pacote, atribuição de origem, campos de compatibilidade e informações de integridade de artefatos.

O OpenClaw verifica a compatibilidade antes de instalar plugins hospedados no ClawHub. Registros de pacote também podem expor metadados de digest para que o OpenClaw possa verificar artefatos baixados. O ClawScan inclui metadados de env/config declarados no `openclaw.environment` do pacote ao revisar versões de plugins, para que os requisitos de runtime declarados sejam comparados ao comportamento observado.

## Denúncias

Usuários conectados podem denunciar skills, pacotes e comentários.

As denúncias devem ser específicas e acionáveis. O abuso de denúncias também pode levar a ações na conta.

Exemplos de denúncias:

- metadados enganosos
- requisitos de credenciais ou permissões não declarados
- instruções de instalação suspeitas
- comentários fraudulentos ou falsificação de identidade
- registros de má-fé ou uso indevido de marca registrada
- conteúdo que viola [Uso aceitável](/pt-BR/clawhub/acceptable-usage)

## Denúncias de má-fé ou marca registrada

O ClawHub usa o mesmo pipeline de denúncias e moderação da equipe para registros de má-fé, falsificação de identidade e disputas relacionadas a marcas registradas. Essas denúncias precisam de contexto suficiente para que a equipe identifique o reclamante, a listagem contestada e a ação solicitada.

Inclua:

- a URL canônica da skill ou do pacote no ClawHub e o identificador do proprietário
- a marca registrada, projeto, empresa ou nome de produto em questão
- evidência pública da propriedade ou autoridade do reclamante
- por que o proprietário atual não está autorizado a publicar sob esse nome
- a ação solicitada, como ocultar enquanto aguarda revisão, transferir propriedade, renomear ou remover

Não coloque segredos privados ou documentos legais sensíveis em denúncias públicas. Abra uma issue no GitHub com evidências não sensíveis e peça aos mantenedores um caminho privado de encaminhamento quando necessário.

## Recursos e novas varreduras

Os proprietários podem solicitar uma nova varredura quando acreditarem que uma skill ou pacote foi retido ou sinalizado incorretamente. Moderadores e administradores da plataforma podem solicitar novas varreduras para qualquer skill ou pacote ao lidar com denúncias ou solicitações de suporte:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Para conteúdo moderado, os proprietários podem conseguir enviar um recurso pelas superfícies do ClawHub visíveis ao proprietário. Recursos devem explicar o que mudou ou por que a sinalização está incorreta.

## Retenções de moderação

Quando o scanner estático sinaliza uma skill enviada como maliciosa, o publicador é automaticamente colocado sob retenção de moderação (`requiresModerationAt` definido no usuário). Isso oculta todas as skills do publicador, faz com que publicações futuras comecem ocultas e cria uma entrada de log de auditoria `user.moderation.auto`.

Constatações estáticas suspeitas são mantidas como evidência de arquivo/linha para moderadores, mas não ocultam conteúdo nem decidem sozinhas o veredito de varredura pública. Novos envios permanecem em estado de revisão/pendente até que a revisão por LLM seja concluída. A varredura estática só bloqueia imediatamente em caso de assinaturas maliciosas. Detecções de mecanismos do VirusTotal permanecem visíveis como evidência de segurança, mas vereditos do VirusTotal Code Insight/Palm são consultivos e não ocultam skills por si só. Revisões por LLM do ClawScan mantêm notas alinhadas ao propósito como orientação. Constatações médias de revisão permanecem visíveis no artefato, enquanto o filtro suspeito é reservado para preocupações de alto impacto do LLM, constatações maliciosas ou detecções corroboradas por mecanismos de AV.

Administradores podem remover uma retenção por falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Isso limpa `requiresModerationAt` e `requiresModerationReason`, restaura skills ocultas pela retenção no nível do usuário e grava uma entrada de log de auditoria `user.moderation.lift`. Skills ocultas por outros motivos, ou cuja própria varredura estática ainda permanece maliciosa, continuam ocultas.

## Banimentos e situação da conta

Contas que violam a política do ClawHub podem perder o acesso de publicação. Abusos graves podem resultar em banimentos de conta, revogação de token, conteúdo oculto ou listagens removidas.

Contas excluídas, banidas ou desativadas não podem usar tokens de API do ClawHub. Se a autenticação da CLI começar a falhar após uma ação na conta, entre na interface web para revisar o estado da conta ou entre em contato com os mantenedores pelo canal de suporte esperado do projeto.

## Orientações para publicadores

Para reduzir falsos positivos e melhorar a confiança do usuário:

- mantenha nomes, resumos, tags e changelogs precisos
- declare variáveis de ambiente e permissões necessárias
- evite comandos de instalação ofuscados
- vincule à origem quando possível
- use simulações antes de publicar plugins
- responda com clareza se usuários ou moderadores perguntarem sobre o comportamento do pacote
