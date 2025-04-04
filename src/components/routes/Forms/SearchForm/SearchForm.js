// src/components/routes/Forms/SearchForm/SearchForm.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, Link } from "react-router-dom";
import "./SearchForm.css"; 

const SearchForm = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [selectedTeamUser, setSelectedTeamUser] = useState('');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndTeam = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.REACT_APP_API_URL;
  
        // Fetch user data
        const userResponse = await axios.get(`${apiUrl}/current-user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userResponse.data);
        
        // Check if user is admin
        const userRole = userResponse.data.role;
        const isAdminUser = userRole === 'Super_Admin' || userRole === 'Department_Admin';
        setIsAdmin(isAdminUser);
        
        // If user is MIS, redirect to upload page
        if (userRole === 'MIS') {
          navigate('/upload-customer-data');
          return;
        }

        // Fetch team users if admin
        if (isAdminUser) {
          const teamResponse = await axios.get(`${apiUrl}/users`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          // Filter out non-team users (like admins)
          const teamUsers = teamResponse.data.filter(user => 
            user.role !== 'Super_Admin' && 
            user.role !== 'Department_Admin' && 
            user.role !== 'MIS'
          );
          setTeamUsers(teamUsers);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to fetch user data');
      }
    };

    fetchUserAndTeam();
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams(location.search);
        const searchQuery = query.get('query');
        
        if (!searchQuery) {
          setError('No search query provided');
          setLoading(false);
          return;
        }

        console.log('Fetching search results for:', searchQuery); // Debug log
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        const apiUrl = process.env.REACT_APP_API_URL;
        const response = await axios.get(`${apiUrl}/customers/search?query=${searchQuery}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Search results:', response.data); // Debug log
        
        if (Array.isArray(response.data)) {
          setResults(response.data);
        } else {
          console.error('Unexpected response format:', response.data);
          setError('Invalid response format from server');
        }
      } catch (error) {
        console.error('Search error:', error.response || error);
        setError(error.response?.data?.message || 'Error fetching search results');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.search]);

  const handleEdit = (customer) => {
    navigate('/customers/phone/' + customer.phone_no, { state: { customer } });
  };

  const handleSelect = (customerId) => {
    setSelectedRecords(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  };

  const handleSelectAll = () => {
    const currentRecords = getCurrentPageRecords();
    if (selectedRecords.length === currentRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(currentRecords.map(record => record.C_unique_id));
    }
  };

  const handleAssignTeam = async () => {
    if (!selectedTeamUser || selectedRecords.length === 0) {
      alert('Please select team user and customers to assign');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL;
      
      // Debug logs
      console.log('Selected Team User:', selectedTeamUser);
      console.log('Selected Records:', selectedRecords);
      
      // Assign each customer to the selected team user
      const assignPromises = selectedRecords.map(async (C_unique_id) => {
        // First, get the customer's numeric ID
        const [customer] = results.filter(c => c.C_unique_id === C_unique_id);
        if (!customer) {
          throw new Error(`Customer with ID ${C_unique_id} not found in results`);
        }

        const requestData = {
          customer_id: C_unique_id,
          user_id: selectedTeamUser,
          department_id: user?.department_id
        };
        console.log('Sending request data:', requestData);
        
        // First, assign the customer
        const assignResponse = await axios.post(
          `${apiUrl}/assign-customer`, 
          requestData,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (assignResponse.data.success) {
          // Then, log the change
          const selectedUser = teamUsers.find(u => String(u.id) === String(selectedTeamUser));
          const oldAgent = customer.agent_name || 'Unassigned';
          
          await axios.post(
            `${apiUrl}/customers/log-change`,
            {
              customerId: customer.id, // Numeric ID from the database
              C_unique_id: C_unique_id, // The FF_XXX format ID
              changes: [{
                field: 'agent_assigned',
                old_value: oldAgent,
                new_value: selectedUser ? selectedUser.username : 'Unknown User',
                changed_by: user?.username || 'System'
              }]
            },
            {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
        }
      });

      await Promise.all(assignPromises);

      // Refresh the search results
      const query = new URLSearchParams(location.search);
      const searchQuery = query.get('query');
      if (searchQuery) {
        const response = await axios.get(`${apiUrl}/customers/search?query=${searchQuery}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setResults(response.data);
      }
      
      setSelectedRecords([]);
      setSelectedTeamUser('');
      alert('Customers assigned successfully!');
    } catch (error) {
      console.error('Error assigning customers:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to assign customers. Please try again.';
      alert(errorMsg);
    }
  };

  // Function to format the last updated timestamp
  const formatDateTime = (dateString) => {
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    return new Date(dateString).toLocaleString('en-GB', options);
  };

  // Pagination functions
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const getCurrentPageRecords = () => {
    return results.slice(indexOfFirstRecord, indexOfLastRecord);
  };
  const currentRecords = getCurrentPageRecords();

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <div className="header-containerrr">
        <Link to="/customers">
          <img src="/uploads/house-fill.svg" alt="Home" className="home-icon" />
        </Link>
        <h2 className="list_form_headiii">Search Results</h2>
      </div>
      <div className="list-containerr">
        {results.length > 0 ? (
          <table className="customers-table">
            <thead>
              <tr className="customer-row">
                  {isAdmin && (
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedRecords.length === currentRecords.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th>ID</th>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Region</th>
                  <th>Disposition</th>
                  <th>Gender</th>
                  <th>Investment Trading</th>
                  <th>Agent Assigned</th>
                  <th>Last Updated</th>
              </tr>
            </thead>
            <tbody className="customer-body">
              {currentRecords.map((customer) => (
                <tr 
                  key={customer.id}
                  onClick={(e) => {
                    if (e.target.type !== 'checkbox') {
                      handleEdit(customer);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {isAdmin && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRecords.includes(customer.C_unique_id)}
                        onChange={() => handleSelect(customer.C_unique_id)}
                      />
                    </td>
                  )}
                  <td>{customer.C_unique_id}</td>
                  <td className="customer-name">{customer.first_name} {customer.last_name}</td>
                  <td>{customer.email_id}</td>
                  <td><a href={`tel:${customer.phone_no}`}>{customer.phone_no}</a></td>
                  <td>{customer.region}</td>
                  <td>{customer.disposition}</td>
                  <td>{customer.gender}</td>
                  <td>{customer.investment_trading}</td>
                  <td>{customer.agent_name}</td>
                  <td>{formatDateTime(customer.last_updated)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No results found.</p>
        )}
      </div>

      {/* Pagination Controls */}
      {results.length > 0 && (
        <div className="pagination-containerr">
          <div className="paginationn">
            {currentPage > 1 && (
              <button
                onClick={() => paginate(currentPage - 1)}
                className="page-numberr"
                aria-label="Previous page"
              >
                Previous
              </button>
            )}

            {[...Array(Math.ceil(results.length / recordsPerPage)).keys()].map((_, idx) => idx + 1)
              .filter((pageNumber) => {
                const totalPages = Math.ceil(results.length / recordsPerPage);
                return (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1
                );
              })
              .map((pageNumber, index, array) => {
                const isGap = array[index + 1] !== pageNumber + 1 && pageNumber !== Math.ceil(results.length / recordsPerPage);
                return (
                  <React.Fragment key={pageNumber}>
                    <button
                      onClick={() => paginate(pageNumber)}
                      className={`page-numberr ${currentPage === pageNumber ? 'active' : ''}`}
                      aria-label={`Go to page ${pageNumber}`}
                    >
                      {pageNumber}
                    </button>
                    {isGap && <span className="ellipsiss">...</span>}
                  </React.Fragment>
                );
              })}

            {currentPage < Math.ceil(results.length / recordsPerPage) && (
              <button
                onClick={() => paginate(currentPage + 1)}
                className="page-number"
                aria-label="Next page"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}

      {/* Team assignment controls for admin */}
      {isAdmin && selectedRecords.length > 0 && (
        <div className="team-assignment-controls">
          <select 
            value={selectedTeamUser}
            onChange={(e) => setSelectedTeamUser(e.target.value)}
            className="team-user-select"
          >
            <option value="">Select User</option>
            {teamUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
          <button 
            onClick={handleAssignTeam}
            className="assign-team-btn"
            disabled={!selectedTeamUser}
          >
            Assign to Team User
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchForm;
