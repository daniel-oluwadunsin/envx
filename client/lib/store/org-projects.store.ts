import { create } from "zustand";
import { Organization, Project } from "../types";

type OrgProjectState = {
  organizations: Organization[];
  projects: Project[];
  selectedOrg: Organization | null;
  selectedProject: Project | null;
};

type OrgProjectActions = {
  setOrganizations: (orgs: Organization[]) => void;
  setProjects: (projects: Project[]) => void;
  setSelectedOrg: (org: Organization) => void;
  setSelectedProject: (project: Project) => void;
};

export type OrgProjectStore = OrgProjectState & OrgProjectActions;

export const useOrgProjectStore = create<OrgProjectStore>()((set) => ({
  organizations: [],
  projects: [],
  selectedOrg: null,
  selectedProject: null,
  setOrganizations: (orgs) => set({ organizations: orgs }),
  setProjects: (projects) => set({ projects }),
  setSelectedOrg: (org) => set({ selectedOrg: org }),
  setSelectedProject: (project) => set({ selectedProject: project }),
}));
