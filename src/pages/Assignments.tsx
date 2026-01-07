import { useState } from "react";
import { Search, Filter, Plus } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AssignmentCard } from "@/components/dashboard/AssignmentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const allAssignments = [
  {
    title: "Machine Learning Project",
    course: "CS 4510 - Artificial Intelligence",
    dueDate: "Jan 15, 2026",
    status: "pending" as const,
  },
  {
    title: "Database Design Essay",
    course: "CS 3200 - Databases",
    dueDate: "Jan 12, 2026",
    status: "submitted" as const,
    aiUsed: true,
    blockchainVerified: true,
  },
  {
    title: "Algorithm Analysis",
    course: "CS 3100 - Algorithms",
    dueDate: "Jan 8, 2026",
    status: "graded" as const,
    grade: "A-",
    blockchainVerified: true,
  },
  {
    title: "Operating Systems Lab",
    course: "CS 3500 - Operating Systems",
    dueDate: "Jan 20, 2026",
    status: "pending" as const,
  },
  {
    title: "Network Security Report",
    course: "CS 4600 - Cybersecurity",
    dueDate: "Jan 5, 2026",
    status: "late" as const,
  },
  {
    title: "Software Engineering Plan",
    course: "CS 4000 - Software Engineering",
    dueDate: "Jan 3, 2026",
    status: "graded" as const,
    grade: "B+",
    aiUsed: true,
    blockchainVerified: true,
  },
];

export default function Assignments() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const navigate = useNavigate();

  const filteredAssignments = allAssignments.filter((a) => {
    const matchesSearch = 
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.course.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || a.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Assignments</h1>
            <p className="text-muted-foreground">Manage and track your coursework</p>
          </div>
          <Button variant="gradient" onClick={() => navigate("/ai-generator")}>
            <Plus className="w-4 h-4" />
            New Submission
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["all", "pending", "submitted", "graded", "late"].map((status) => (
              <Button
                key={status}
                variant={filter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Assignments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAssignments.map((assignment, index) => (
            <div
              key={assignment.title}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <AssignmentCard
                {...assignment}
                onSubmit={() => navigate("/ai-generator")}
              />
            </div>
          ))}
        </div>

        {filteredAssignments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No assignments found</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
