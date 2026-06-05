"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useUiStore } from "@/store/ui.store";
import { usePermissions } from "@/hooks/use-permissions";
import { leadsApi } from "@/services/api/leads.api";
import { clientsApi } from "@/services/api/clients.api";
import { projectsApi } from "@/services/api/projects.api";
import { employeesApi } from "@/services/api/employees.api";
import { ROUTES } from "@/constants/routes";

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUiStore();
  const { canRead } = usePermissions();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!commandPaletteOpen) setSearch("");
  }, [commandPaletteOpen]);

  const { data: leads } = useQuery({
    queryKey: ["search", "leads", search],
    queryFn: () => leadsApi.getAll({ search, limit: 5 }),
    enabled: commandPaletteOpen && search.length >= 2 && canRead("leads"),
  });

  const { data: clients } = useQuery({
    queryKey: ["search", "clients", search],
    queryFn: () => clientsApi.getAll({ search, limit: 5 }),
    enabled: commandPaletteOpen && search.length >= 2 && canRead("clients"),
  });

  const { data: projects } = useQuery({
    queryKey: ["search", "projects", search],
    queryFn: () => projectsApi.getAll({ search, limit: 5 }),
    enabled: commandPaletteOpen && search.length >= 2 && canRead("projects"),
  });

  const { data: employees } = useQuery({
    queryKey: ["search", "employees", search],
    queryFn: () => employeesApi.getAll({ search, limit: 5 }),
    enabled: commandPaletteOpen && search.length >= 2 && canRead("employees"),
  });

  if (!commandPaletteOpen) return null;

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search leads, clients, projects, employees..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>
            {search.length < 2 ? "Type at least 2 characters to search" : "No results found."}
          </CommandEmpty>
          {leads?.data?.length ? (
            <CommandGroup heading="Leads">
              {leads.data.map((lead) => (
                <CommandItem
                  key={lead._id}
                  value={lead._id}
                  onSelect={() => {
                    router.push(`${ROUTES.leads}/${lead._id}`);
                    setCommandPaletteOpen(false);
                  }}
                >
                  {lead.lead_name} {lead.company_name ? `· ${lead.company_name}` : ""}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {clients?.data?.length ? (
            <CommandGroup heading="Clients">
              {clients.data.map((client) => (
                <CommandItem
                  key={client._id}
                  value={client._id}
                  onSelect={() => {
                    router.push(`${ROUTES.clients}/${client._id}`);
                    setCommandPaletteOpen(false);
                  }}
                >
                  {client.company_name}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {projects?.data?.length ? (
            <CommandGroup heading="Projects">
              {projects.data.map((project) => (
                <CommandItem
                  key={project._id}
                  value={project._id}
                  onSelect={() => {
                    router.push(`${ROUTES.projects}/${project._id}`);
                    setCommandPaletteOpen(false);
                  }}
                >
                  {project.project_name}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {employees?.data?.length ? (
            <CommandGroup heading="Employees">
              {employees.data.map((employee) => (
                <CommandItem
                  key={employee._id}
                  value={employee._id}
                  onSelect={() => {
                    router.push(`${ROUTES.employees}/${employee._id}`);
                    setCommandPaletteOpen(false);
                  }}
                >
                  {employee.full_name}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
