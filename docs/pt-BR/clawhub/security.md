---
read_when:
    - Entendendo os resultados de varredura e moderação do ClawHub
    - Denunciar uma Skill ou pacote
    - Recuperação de uma listagem retida, oculta ou bloqueada
summary: Comportamento de confiança, verificação, denúncias e moderação do ClawHub.
x-i18n:
    generated_at: "2026-05-12T15:42:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Segurança + Moderação

O ClawHub é aberto para publicação, mas as listagens públicas ainda passam por controles de confiança, verificação, denúncia e moderação. O objetivo é prático: ajudar usuários a inspecionar o que instalam, oferecer aos publicadores um caminho de recuperação para falsos positivos e manter pacotes abusivos fora da descoberta pública.

Veja também [Uso aceitável](/pt-BR/clawhub/acceptable-usage).

## O que os usuários podem inspecionar

Antes de instalar um skill ou plugin, verifique a listagem dele no ClawHub para:

- atribuição de proprietário e origem
- versão mais recente e changelog
- variáveis de ambiente ou permissões exigidas
- metadados de compatibilidade para plugins
- status de verificação ou moderação
- denúncias, comentários, estrelas, downloads e sinais de instalação quando exibidos

Instale apenas conteúdo que você entende e confia.

## Estados de verificação

O ClawHub pode mostrar resultados de verificação ou moderação em páginas públicas e diagnósticos visíveis ao proprietário.

Resultados comuns incluem:

- `clean`: nenhum problema bloqueador foi encontrado.
- `suspicious`: a versão exige cautela ou revisão.
- `malicious`: a versão é considerada insegura.
- `pending`: as verificações ainda não foram concluídas.
- `held`, `quarantined`, `revoked` ou `hidden`: a versão não está totalmente disponível em superfícies públicas de instalação.

A redação exata pode variar por superfície, mas o significado prático é o mesmo: se uma versão estiver retida ou bloqueada, os usuários não devem instalá-la até que o proprietário resolva o problema ou a moderação a restaure.

## Skills

As verificações de Skills analisam o pacote de skill publicado, metadados, requisitos declarados e instruções suspeitas.

O ClawHub presta atenção especial a incompatibilidades entre o que um skill declara e o que ele parece fazer. Por exemplo, um skill que referencia uma chave de API exigida deve declarar esse requisito em `SKILL.md` para que os usuários possam vê-lo antes da instalação.

Achados de verificação são baseados em artefatos. Comportamentos esperados do provedor, como credenciais de API declaradas, callbacks OAuth de localhost, limpeza de desinstalação com escopo, codificação Basic Auth ou uploads de arquivos selecionados pelo usuário para o provedor declarado, são tratados de forma diferente de encaminhamento oculto de credenciais, acesso amplo a arquivos privados, destinos de rede não relacionados ou abuso furtivo de navegador.

Veja [Formato de skill](/pt-BR/clawhub/skill-format).

## Plugins

Versões de plugins incluem metadados de pacote, atribuição de origem, campos de compatibilidade e informações de integridade de artefato.

O OpenClaw verifica a compatibilidade antes de instalar plugins hospedados no ClawHub. Registros de pacote também podem expor metadados de digest para que o OpenClaw possa verificar artefatos baixados. O ClawScan inclui metadados declarados de env/config do pacote `openclaw.environment` ao revisar versões de plugins, para que requisitos declarados de runtime sejam comparados ao comportamento observado.

## Denúncias

Usuários autenticados podem denunciar Skills, pacotes e comentários.

As denúncias devem ser específicas e acionáveis. O abuso do sistema de denúncias pode, por si só, levar a uma ação sobre a conta.

Exemplos de denúncias:

- metadados enganosos
- requisitos de credencial ou permissão não declarados
- instruções de instalação suspeitas
- comentários fraudulentos ou impersonificação
- registros de má-fé ou uso indevido de marca registrada
- conteúdo que viola [Uso aceitável](/pt-BR/clawhub/acceptable-usage)

## Notas do ClawScan para publicadores

Publicadores podem fornecer uma nota opcional do ClawScan ao publicar um skill ou plugin. Essa nota dá ao ClawScan contexto para comportamentos que, de outra forma, poderiam parecer incomuns, como acesso à rede, acesso a host nativo ou credenciais específicas de provedor.

## Retenções de moderação

Quando o verificador estático sinaliza um skill enviado como malicioso, o publicador é colocado automaticamente sob uma retenção de moderação (`requiresModerationAt` definido no usuário). Isso oculta todos os Skills do publicador, faz com que publicações futuras comecem ocultas e cria uma entrada de log de auditoria `user.moderation.auto`.

Achados estáticos suspeitos são mantidos como evidência de arquivo/linha para moderadores, mas não ocultam conteúdo nem decidem por conta própria o veredito público da verificação. Novos envios permanecem em estado de revisão/pendente até que a revisão por LLM seja concluída. A verificação estática só bloqueia imediatamente no caso de assinaturas maliciosas. Detecções de mecanismos do VirusTotal permanecem visíveis como evidência de segurança, mas vereditos do VirusTotal Code Insight/Palm são consultivos e não ocultam Skills por conta própria. Revisões LLM do ClawScan mantêm notas alinhadas ao propósito como orientação. Achados médios de revisão permanecem visíveis no artefato, enquanto o filtro suspeito é reservado para preocupações LLM de alto impacto, achados maliciosos ou detecções corroboradas por mecanismos AV.

Administradores podem suspender uma retenção por falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Isso limpa `requiresModerationAt` e `requiresModerationReason`, restaura Skills ocultos pela retenção no nível do usuário e grava uma entrada de log de auditoria `user.moderation.lift`. Skills ocultos por outros motivos, ou cujo próprio scan estático continua malicioso, permanecem ocultos.

## Banimentos e situação da conta

Contas que violam a política do ClawHub podem perder acesso de publicação. Abusos graves podem resultar em banimentos de conta, revogação de tokens, conteúdo oculto ou listagens removidas.

Contas excluídas, banidas ou desativadas não podem usar tokens de API do ClawHub. Se a autenticação da CLI começar a falhar após uma ação na conta, entre na UI web para revisar o estado da conta. Se o login ou o acesso normal pela CLI estiver bloqueado, entre em contato com security@openclaw.ai para revisão de recuperação.

## Orientação para publicadores

Para reduzir falsos positivos e melhorar a confiança dos usuários:

- mantenha nomes, resumos, tags e changelogs precisos
- declare variáveis de ambiente e permissões exigidas
- adicione uma nota do ClawScan para o publicador quando uma versão tiver comportamento incomum, mas intencional
- evite comandos de instalação ofuscados
- vincule ao código-fonte quando possível
- use execuções de teste antes de publicar plugins
- responda com clareza se usuários ou moderadores perguntarem sobre o comportamento do pacote
