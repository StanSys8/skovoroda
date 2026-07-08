import { AutomationInstance } from './automation-instance.entity';
import { CreateCommandDto } from '../agent/agent.dto';
import { RiskLevel } from '../agent/agent-command.entity';

/** Lane a persistent instance's dedicated agent session polls. */
export function instanceLane(inst: AutomationInstance): string {
  return inst.persistent ? `inst:${inst.id}` : 'main';
}

/**
 * Build an agent command from an automation instance.
 * Returns null when the instance has no usable instructionUrl.
 */
export function commandFromInstance(
  inst: AutomationInstance,
): CreateCommandDto | null {
  const instructionUrl = inst.config?.['instructionUrl'];
  if (typeof instructionUrl !== 'string' || !instructionUrl) return null;

  const title = [inst.name || 'Automation', inst.project?.name]
    .filter(Boolean)
    .join(' → ');

  return {
    title,
    instructionUrl,
    payload: inst.config,
    riskLevel: (inst.config?.['riskLevel'] as RiskLevel) ?? 'read',
    projectId: inst.projectId,
    instanceId: inst.id,
    lane: instanceLane(inst),
  };
}
