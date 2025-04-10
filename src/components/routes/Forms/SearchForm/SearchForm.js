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
  const [totalCount, setTotalCount] = useState(0);
  const [userRole, setUserRole] = useState('');
  const [teamId, setTeamId] = useState(null);
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
        
        // Set user role and check admin status
        const role = userResponse.data.role.toLowerCase();
        setUserRole(role);
        const isAdminUser = ['super_admin', 'it_admin', 'business_head'].includes(role);
        setIsAdmin(isAdminUser);
        
        // Store team ID if user is team_leader
        if (role === 'team_leader') {
          setTeamId(userResponse.data.team_id);
        }

        // Fetch team users if admin
        if (isAdminUser) {
          try {
            const teamResponse = await axios.get(`${apiUrl}/team-users`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (teamResponse.data && Array.isArray(teamResponse.data)) {
              // Filter out admin roles
              const teamUsers = teamResponse.data.filter(user => 
                !['super_admin', 'it_admin', 'business_head', 'team_leader'].includes(user.role.toLowerCase())
              );
              setTeamUsers(teamUsers);
            } else {
              setTeamUsers([]);
            }
          } catch (teamError) {
            console.error('Error fetching team users:', teamError);
            setTeamUsers([]);
          }
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
          setResults([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        const apiUrl = process.env.REACT_APP_API_URL;
        
        // Build search URL based on user role
        let searchUrl = `${apiUrl}/customers/search?query=${searchQuery}`;
        
        // Add role-specific parameters
        if (userRole === 'team_leader' && teamId) {
          searchUrl += `&team_id=${teamId}`;
        } else if (userRole === 'user') {
          searchUrl += `&agent_id=${user.id}`;
        }
        // super_admin, it_admin, and business_head get unfiltered results

        const response = await axios.get(searchUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Handle both array and object response formats
        if (Array.isArray(response.data)) {
          setResults(response.data);
          setTotalCount(response.data.length);
        } else if (response.data && typeof response.data === 'object') {
          if (response.data.success && Array.isArray(response.data.data)) {
            setResults(response.data.data);
            setTotalCount(response.data.count || response.data.data.length);
          } else {
            setResults([]);
            setTotalCount(0);
          }
        } else {
          console.error('Unexpected response format:', response.data);
          setError('Invalid response format from server');
          setResults([]);
          setTotalCount(0);
        }
      } catch (error) {
        console.error('Search error:', error.response || error);
        setError(error.response?.data?.message || 'Error fetching search results');
        setResults([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.search, userRole, teamId, user]);

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
                  <th>CRN</th>
                  <th>Loan No/ Card No</th>
                  <th>Customer Name</th>
                  <th>Product</th>
                  <th>Bank Name</th>
                  <th>Agent Name</th>
                  <th>DPD Vintage</th>
                  <th>POS</th>
                  <th>EMI Amount</th>
                  <th>Loan Amount</th>
                  <th>Mobile</th>
                  <th>Paid Amount</th>
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
                  <td>{customer.CRN}</td>
                  <td className="customer-name">{customer.c_name} </td>
                  <td><a href={`tel:${customer.mobile}`}>{customer.mobile}</a></td>
                  <td>{customer.product}</td>
                  <td>{customer.bank_name}</td>
                  <td>{customer.agent_name}</td>
                  <td>{customer.DPD_vintage}</td>
                  <td>{customer.POS}</td>
                  <td>{customer.emi_AMT}</td>
                  <td>{customer.loan_AMT}</td>
                  <td>{customer.mobile}</td>
                  <td>{customer.paid_AMT}</td>
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

            {[...Array(Math.ceil(totalCount / recordsPerPage)).keys()].map((_, idx) => idx + 1)
              .filter((pageNumber) => {
                const totalPages = Math.ceil(totalCount / recordsPerPage);
                return (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1
                );
              })
              .map((pageNumber, index, array) => {
                const isGap = array[index + 1] !== pageNumber + 1 && pageNumber !== Math.ceil(totalCount / recordsPerPage);
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

            {currentPage < Math.ceil(totalCount / recordsPerPage) && (
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
