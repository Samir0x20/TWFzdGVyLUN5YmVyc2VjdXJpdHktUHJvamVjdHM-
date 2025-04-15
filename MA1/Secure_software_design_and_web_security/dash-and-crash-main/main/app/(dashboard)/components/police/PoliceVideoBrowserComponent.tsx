"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  TextField,
  Collapse,
  IconButton,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import PlayerComponent from "../dashcam/TrustedPlayerComponent";

interface VideoData {
  id: number;
  code: string;
  dateStarted: string;
  sharedByEmail: string;
  chunkCount: number;
  accessKey: string;
  encryptedPrivateKeyEnc: string; // Add the encrypted private key property
}

interface Row extends VideoData {
  isExpanded: boolean;
}

interface SortConfig {
  field: keyof VideoData;
  direction: "asc" | "desc";
}

export default function PoliceVideoBrowserComponent() {
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "dateStarted",
    direction: "desc",
  });

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/trusted/videos", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Request-Time": new Date().toISOString(), // Add the current date to the headers
        },
      });

      if (!response.ok) {
        throw new Error("There is no shared video for you");
      }

      const { videos } = await response.json();
      const rowsWithExpanded = videos.map((video: VideoData) => ({
        ...video,
        isExpanded: false,
      }));
      setRows(rowsWithExpanded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("[DEBUG] Error fetching videos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleSort = (field: keyof VideoData) => {
    setSortConfig({
      field,
      direction:
        sortConfig.field === field && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  const sortedRows = [...rows].sort((a, b) => {
    const { field, direction } = sortConfig;
    const modifier = direction === "asc" ? 1 : -1;

    if (a[field] < b[field]) return -1 * modifier;
    if (a[field] > b[field]) return 1 * modifier;
    return 0;
  });

  const filteredRows = sortedRows.filter((row) =>
    Object.values(row).some(
      (value) =>
        typeof value === "string" &&
        value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExpandRow = (code: string) => {
    setRows((prevRows) =>
      prevRows.map((row) => ({
        ...row,
        isExpanded: row.code === code ? !row.isExpanded : row.isExpanded,
      }))
    );
  };

  const ExpandableRow = ({ row }: { row: Row }) => (
    <>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton size="small" onClick={() => handleExpandRow(row.code)}>
            {row.isExpanded ? (
              <KeyboardArrowUpIcon />
            ) : (
              <KeyboardArrowDownIcon />
            )}
          </IconButton>
        </TableCell>
        <TableCell>
          <Box
            component="img"
            sx={{
              height: 60,
              width: 80,
              objectFit: "cover",
              borderRadius: 1,
            }}
            src={`/api/get-thumbnail?videoCode=${row.code}`}
            alt={`Video ${row.code} thumbnail`}
          />
        </TableCell>
        <TableCell>{row.code}</TableCell>
        <TableCell>{new Date(row.dateStarted).toLocaleString()}</TableCell>
        <TableCell>{row.sharedByEmail}</TableCell>
        <TableCell>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" color="text.secondary">
              {row.chunkCount} chunks
            </Typography>
            <IconButton
              color="primary"
              onClick={() => handleExpandRow(row.code)}
            >
              <PlayArrowIcon />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={row.isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Box sx={{ aspectRatio: "16/9", my: 2 }}>
                <PlayerComponent
                  video={{
                    code: row.code,
                    chunkCount: row.chunkCount,
                    encryptedAesKey: row.accessKey,
                    encryptedPrivateKeyEnc: row.encryptedPrivateKeyEnc,
                  }}
                /> 
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ width: "100%", mb: 2 }}>
      <Typography
        variant="h6"
        sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}
      >
        Shared Videos
      </Typography>
      <Box p={2} display="flex" alignItems="center">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search videos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
            ),
          }}
        />
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50} />
              <TableCell>Thumbnail</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === "code"}
                  direction={
                    sortConfig.field === "code" ? sortConfig.direction : "asc"
                  }
                  onClick={() => handleSort("code")}
                >
                  Code
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === "dateStarted"}
                  direction={
                    sortConfig.field === "dateStarted"
                      ? sortConfig.direction
                      : "asc"
                  }
                  onClick={() => handleSort("dateStarted")}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === "sharedByEmail"}
                  direction={
                    sortConfig.field === "sharedByEmail"
                      ? sortConfig.direction
                      : "asc"
                  }
                  onClick={() => handleSort("sharedByEmail")}
                >
                  Shared By
                </TableSortLabel>
              </TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
                <ExpandableRow key={row.code} row={row} />
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredRows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
